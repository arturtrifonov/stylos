import test from 'node:test';
import assert from 'node:assert/strict';
import { checkboxBehavior } from '../packages/ui/src/behaviors/checkbox.ts';

function environment(selection) {
  const document = new EventTarget();
  const form = {};
  const input = Object.assign(new EventTarget(), {
    checked: false, indeterminate: false, defaultChecked: false,
    ownerDocument: document, form,
  });
  const changes = [];
  const action = checkboxBehavior(input, {isChecked: selection, onChange: value => changes.push(value)});
  function reset(target = form) {
    const event = new Event('reset', {cancelable: true});
    Object.defineProperty(event, 'target', {value: target});
    document.dispatchEvent(event);
    return event;
  }
  return {input, changes, action, reset};
}
const nextTask = () => new Promise(resolve => setTimeout(resolve, 1));

test('reset cancellation after a microtask checkpoint preserves binding and native selection', async () => {
  for (const initial of ['false', 'true', 'mixed']) {
    const {input, changes, action, reset} = environment(initial);
    action.update({isChecked: initial === 'true' ? 'false' : 'true', onChange: value => changes.push(value)});
    const current = [input.checked, input.indeterminate];
    const event = reset();
    // Trusted browser dispatch may checkpoint before the form's reset listener.
    await Promise.resolve();
    assert.deepEqual([input.checked, input.indeterminate], current);
    assert.deepEqual(changes, []);
    event.preventDefault();
    await nextTask();
    assert.deepEqual([input.checked, input.indeterminate], current);
    assert.deepEqual(changes, []);
    action.destroy();
  }
});

test('uncancelled reset restores initial binary or mixed selection after dispatch', async () => {
  for (const initial of ['false', 'true', 'mixed']) {
    const {input, changes, action, reset} = environment(initial);
    action.update({isChecked: initial === 'true' ? 'false' : 'true', onChange: value => changes.push(value)});
    assert.equal(input.defaultChecked, initial === 'true');
    reset();
    await nextTask();
    assert.equal(input.checked, initial === 'true');
    assert.equal(input.indeterminate, initial === 'mixed');
    assert.deepEqual(changes, [initial]);
    action.destroy();
  }
});

test('unrelated reset and disposal do not notify or reset a control', async () => {
  const {input, changes, action, reset} = environment('false');
  input.checked = true;
  reset({});
  await nextTask();
  assert.equal(input.checked, true);
  reset();
  action.destroy();
  await nextTask();
  input.dispatchEvent(new Event('change'));
  assert.equal(input.checked, true);
  assert.deepEqual(changes, []);
});
