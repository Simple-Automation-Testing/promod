import { isPromise, toArray } from 'sat-utils';

interface EngineElementLike {
  getEngineElement?: () => Promise<unknown>;
  getEngineElements?: () => Promise<unknown[]>;
}

async function toNativeEngineExecuteScriptArgs(args: unknown[]): Promise<unknown[]> {
  const executeScriptArgs: unknown[] = [];
  const argsArray = toArray(args);

  if (!argsArray.length) return executeScriptArgs;

  for (const item of argsArray) {
    const resolvedItem: unknown = isPromise(item) ? await item : item;
    if (Array.isArray(resolvedItem)) {
      const arrayItems: unknown[] = [];

      for (const itemArr of resolvedItem) {
        arrayItems.push(itemArr);
      }
      executeScriptArgs.push(arrayItems);
    } else if (resolvedItem && (resolvedItem as EngineElementLike).getEngineElement) {
      executeScriptArgs.push(await (resolvedItem as EngineElementLike).getEngineElement());
    } else if (resolvedItem && (resolvedItem as EngineElementLike).getEngineElements) {
      executeScriptArgs.push(...(await (resolvedItem as EngineElementLike).getEngineElements()));
    } else {
      executeScriptArgs.push(resolvedItem);
    }
  }

  return executeScriptArgs;
}

export { toNativeEngineExecuteScriptArgs };
