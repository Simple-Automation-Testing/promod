import { toArray, isPromise, isArray } from 'sat-utils';

async function toNativeEngineExecuteScriptArgs(args) {
  const executeScriptArgs = [];
  const argsArray = toArray(args);

  if (!argsArray.length) return;

  for (const item of argsArray) {
    const resolvedItem = isPromise(item) ? await item : item;

    if (Array.isArray(resolvedItem)) {
      const arrayItems = [];

      for (const itemArr of resolvedItem) {
        arrayItems.push(itemArr);
      }
      executeScriptArgs.push(arrayItems);
    } else if (resolvedItem && resolvedItem.getEngineElement) {
      executeScriptArgs.push(await resolvedItem.getEngineElement());
    } else if (resolvedItem && resolvedItem.getEngineElements) {
      executeScriptArgs.push(...(await resolvedItem.getEngineElements()));
    } else {
      executeScriptArgs.push(item);
    }
  }

  if (executeScriptArgs.length === 1 && !isArray(args)) return executeScriptArgs[0];

  return executeScriptArgs;
}

export { toNativeEngineExecuteScriptArgs };
