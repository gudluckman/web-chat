import { clearData, getData, setData, workspace } from './dataStore';

/**
 * Resets the internal data of the application to it's initial state.
 * Returns an empty object.
 * @returns An empty object as it resets the internal data.
 */
function clearV1() {
  const dataStore = getData();

  let key: keyof workspace;
  for (key in dataStore) {
    if (key === 'stats') {
      dataStore[key] = {};
    } else {
      dataStore[key] = [];
    }
  }

  setData();
  clearData();
  return {};
}

export { clearV1 };
