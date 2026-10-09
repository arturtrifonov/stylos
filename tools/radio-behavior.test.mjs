import test from 'node:test';
import assert from 'node:assert/strict';
import { radioBehavior } from '../packages/ui/src/behaviors/radio.ts';

// The adapter observes native checked values; browser group behavior is tested
// separately. This fixture deliberately does not implement grouping or keys.
function environment() {
  const root = new EventTarget();
  const form = {};
  function input(checked = false) {
    return { checked, defaultChecked: false, form, tagName: 'INPUT', type: 'radio',
      ownerDocument: root, getRootNode: () => root };
  }
  function dispatch(type, target, cancelled = false) {
    const event = new Event(type, {cancelable: true});
    Object.defineProperty(event, 'target', {value: target});
    if (cancelled) event.preventDefault();
    root.dispatchEvent(event);
  }
  return {root, form, input, dispatch};
}
const nextTask = () => new Promise(resolve => setTimeout(resolve, 1));

test('selection of a native peer reports deselection without synthetic peer changes', () => {
  const env = environment(), first = env.input(), second = env.input();
  const changes = [];
  const a = radioBehavior(first, {isChecked:'true', onChange:value => changes.push(['first',value])});
  const b = radioBehavior(second, {isChecked:'false', onChange:value => changes.push(['second',value])});
  // Native default action changes both properties but emits only one change.
  first.checked = false; second.checked = true;
  env.dispatch('change', second);
  assert.deepEqual(changes, [['first','false'],['second','true']]);
  env.dispatch('change', second);
  assert.equal(changes.length, 2);
  second.checked = false;
  env.dispatch('change', env.input(true));
  assert.deepEqual(changes.at(-1), ['second','false']);
  a.destroy(); b.destroy();
});

test('reset reads native results after dispatch, rather than the stale checked value', async () => {
  const env = environment(), input = env.input(), changes = [];
  const action = radioBehavior(input, {isChecked:'true', onChange:value => changes.push(value)});
  input.checked = false;
  env.dispatch('change', input);
  env.dispatch('reset', env.form);
  assert.deepEqual(changes, ['false']);
  // Emulate default action occurring after event dispatch.
  input.checked = input.defaultChecked;
  await nextTask();
  assert.deepEqual(changes, ['false','true']);
  action.destroy();
});

test('cancelled reset and destroyed options do not notify the consumer', async () => {
  const env = environment(), input = env.input(), changes = [];
  const action = radioBehavior(input, {isChecked:'false', onChange:value => changes.push(value)});
  input.checked = true;
  env.dispatch('reset', env.form, true);
  await nextTask();
  assert.deepEqual(changes, []);
  env.dispatch('reset', env.form);
  action.destroy();
  await nextTask();
  env.dispatch('change', input);
  assert.deepEqual(changes, []);
});

test('prop updates apply selection and use the latest consumer callback', () => {
  const env = environment(), input = env.input(), changes = [];
  const action = radioBehavior(input, {isChecked:'false', onChange:() => assert.fail('old callback')});
  const next = {isChecked:'true', onChange:value => changes.push(value)};
  action.update(next);
  assert.equal(input.checked, true);
  assert.deepEqual(changes, ['true']);
  action.update(next);
  assert.deepEqual(changes, ['true']);
  assert.equal(input.defaultChecked, false, 'prop updates retain the mount default');
  action.destroy();
});
