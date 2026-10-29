import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const workflow = JSON.parse(readFileSync(new URL('../examples/n8n-workflow-template.json', import.meta.url), 'utf8'));
const node = (name) => {
  const result = workflow.nodes.find((entry) => entry.name === name);
  assert.ok(result, `Missing node: ${name}`);
  assert.ok(!result.disabled && !result.continueOnFail && !result.alwaysOutputData);
  return result;
};
assert.equal(node('Webhook Inbound').parameters.authentication, 'headerAuth');
assert.equal(node('Webhook Inbound').parameters.responseMode, 'onReceived');
const guard = node('Filter Inbound Text');
assert.equal(guard.parameters.mode, 'runOnceForAllItems');
const valid = () => ({ json: { body: {
  event: 'messages.upsert', messageType: 'conversation',
  key: { id: 'test-message', fromMe: false, remoteJid: '5511999999999@s.whatsapp.net' },
  message: { conversation: 'Hello' },
} } });
const filter = (items) => JSON.parse(JSON.stringify(runInNewContext(`(() => { ${guard.parameters.jsCode} })()`, {
  $input: { all: () => items },
})));
const accepted = filter([valid()]);
assert.equal(accepted.length, 1);
assert.equal(accepted[0].json.body.message.conversation, 'Hello');
assert.deepEqual(accepted[0].pairedItem, { item: 0 });
for (const mutate of [
  (b) => { b.key.fromMe = true; },
  (b) => { delete b.key.fromMe; },
  (b) => { b.key.fromMe = 'false'; },
  (b) => { b.key.remoteJid = '123@g.us'; },
  (b) => { b.key.remoteJid = 'status@broadcast'; },
  (b) => { b.key.remoteJid = '123@newsletter'; },
  (b) => { b.key.remoteJid += '\n'; },
  (b) => { b.key.remoteJid = '123@s.whatsapp.net", "number": "attacker'; },
  (b) => { b.key.remoteJid = ['5511999999999@s.whatsapp.net']; },
  (b) => { b.event = 'messages.update'; },
  (b) => { delete b.event; },
  (b) => { b.messageType = 'imageMessage'; },
  (b) => { b.message.conversation = ''; },
  (b) => { b.message.conversation = {}; },
  (b) => { b.key.id = ''; },
  (b) => { delete b.key; },
  (b) => { b.data = { key: b.key, message: b.message }; },
]) {
  const item = valid();
  mutate(item.json.body);
  assert.deepEqual(filter([item]), []);
}
for (const body of [null, [], 'text', {}]) assert.deepEqual(filter([{ json: { body } }]), []);
const extended = valid();
extended.json.body.messageType = 'extendedTextMessage';
extended.json.body.message = { extendedTextMessage: { text: 'Longer reply' } };
assert.equal(filter([extended])[0].json.body.message.conversation, 'Longer reply');
const rejected = valid();
rejected.json.body.key.fromMe = true;
const mixed = filter([rejected, valid()]);
assert.equal(mixed.length, 1);
assert.deepEqual(mixed[0].pairedItem, { item: 1 });

// Every route to an HTTP side effect passes through the filter and persistent dedupe.
const expectedPath = ['Webhook Inbound', 'Filter Inbound Text', 'Deduplicate Messages',
  'Calculate Reading Delay', 'Wait (Reading)', 'Mark As Read', 'Send Presence (Composing)',
  'Calculate Typing Delay', 'Wait (Typing)', 'Send Message'];
assert.equal(workflow.nodes.length, expectedPath.length);
for (let i = 0; i < expectedPath.length; i++) {
  node(expectedPath[i]);
  const edges = workflow.connections[expectedPath[i]]?.main?.flat() ?? [];
  assert.deepEqual(edges.map((edge) => edge.node), expectedPath.slice(i + 1, i + 2));
}
const dedupe = node('Deduplicate Messages');
assert.equal(dedupe.type, 'n8n-nodes-base.removeDuplicates');
assert.equal(dedupe.typeVersion, 2);
assert.equal(dedupe.parameters.operation, 'removeItemsSeenInPreviousExecutions');
assert.equal(dedupe.parameters.dedupeValue, '={{ $json.dedupe_key }}');
assert.equal(dedupe.parameters.options.historySize, 10000);
assert.equal(filter([valid()])[0].json.dedupe_key, accepted[0].json.dedupe_key);
const other = valid();
other.json.body.key.remoteJid = '5511888888888@s.whatsapp.net';
assert.notEqual(filter([other])[0].json.dedupe_key, accepted[0].json.dedupe_key);

// Execute the actual exported expressions, then serialize as the HTTP node does.
const hostile = 'x", "number": "attacker", "extra": "\\\n{{ 1 + 1 }}';
const fixture = valid().json;
fixture.body.key.id = hostile;
fixture.body.key.remoteJid = hostile;
const $ = (name) => {
  assert.equal(name, 'Filter Inbound Text');
  return { item: { json: fixture } };
};
for (const name of ['Mark As Read', 'Send Presence (Composing)', 'Send Message']) {
  const expression = node(name).parameters.jsonBody;
  assert.ok(expression.startsWith('={{') && expression.endsWith('}}'));
  const value = runInNewContext(expression.slice(3, -2), { $, $json: { reply_text: hostile } });
  const body = JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
  assert.equal(body.extra, undefined);
  if (name === 'Mark As Read') {
    assert.deepEqual(body, { readMessages: [{ id: hostile, fromMe: false, remoteJid: hostile }] });
  } else if (name === 'Send Message') {
    assert.deepEqual(body, { number: hostile, text: hostile });
  } else {
    assert.deepEqual(body, { number: hostile, presence: 'composing' });
  }
}
console.log('Workflow security tests passed: JSON, auth configuration, inbound filters, dedupe configuration, routing and injection.');
