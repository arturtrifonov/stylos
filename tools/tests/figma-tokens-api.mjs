// Simulated variable API for plugin unit tests and the browser panel harness.
const clone = value => JSON.parse(JSON.stringify(value));
export function createFigmaTestApi({ maxModes = 10, failWriteAt = 0 } = {}) {
  let serial = 0, writes = 0;
  const state = { collections: [], variables: [] };
  const figma = {
    commitUndo() {},
    variables: {
      async getLocalVariableCollectionsAsync() { return state.collections; },
      async getLocalVariablesAsync() { return state.variables; },
      createVariableCollection(name) {
        const id = `collection-${++serial}`, defaultModeId = `mode-${++serial}`;
        const collection = { id, name, remote: false, isExtension: false, defaultModeId,
          modes: [{ modeId: defaultModeId, name: 'Mode 1' }],
          renameMode(modeId, name) { this.modes.find(mode => mode.modeId === modeId).name = name; },
          addMode(name) { if (this.modes.length >= maxModes) throw new Error('Limited to 1 modes only'); const modeId = `mode-${++serial}`; this.modes.push({ modeId, name }); return modeId; },
          removeMode(modeId) { this.modes = this.modes.filter(mode => mode.modeId !== modeId); for (const variable of state.variables.filter(v => v.variableCollectionId === this.id)) delete variable.valuesByMode[modeId]; },
          remove() { state.collections = state.collections.filter(c => c.id !== this.id); state.variables = state.variables.filter(v => v.variableCollectionId !== this.id); },
        };
        state.collections.push(collection); return collection;
      },
      createVariable(name, collection, resolvedType) {
        const variable = { id: `variable-${++serial}`, name, resolvedType, remote: false,
          variableCollectionId: collection.id, valuesByMode: {},
          setValueForMode(modeId, value) { writes++; if (failWriteAt && writes === failWriteAt) throw new Error('Write failed'); this.valuesByMode[modeId] = clone(value); },
          remove() { state.variables = state.variables.filter(v => v.id !== this.id); },
        };
        state.variables.push(variable); return variable;
      },
      createVariableAlias(variable) { return { type: 'VARIABLE_ALIAS', id: variable.id }; },
    },
  };
  return { figma, state: () => state, getWrites: () => writes };
}
