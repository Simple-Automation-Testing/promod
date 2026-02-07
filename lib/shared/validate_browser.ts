import { isAsyncFunction } from 'sat-utils';

interface ValidateBrowserConfig {
  driverPropertyName: string;
  excludedMethods: string[];
  errorUrlSuffix: string;
}

function validateBrowserCallMethod<T>(browserClass: new () => T, config: ValidateBrowserConfig): T {
  const { driverPropertyName, excludedMethods, errorUrlSuffix } = config;

  const protKeys = Object.getOwnPropertyNames(browserClass.prototype).filter(
    (item) => !excludedMethods.includes(item),
  );

  for (const key of protKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(browserClass.prototype, key);
    if (isAsyncFunction(descriptor.value)) {
      const originalMethod: (...args: unknown[]) => Promise<unknown> = descriptor.value;

      // eslint-disable-next-line no-inner-declarations
      async function decoratedWithChecker(this: Record<string, unknown>, ...args: unknown[]) {
        if (!this[driverPropertyName]) {
          throw new Error(`
${key}(): Seems like driver was not initialized,
or visit https://github.com/Simple-Automation-Testing/promod/blob/master/docs/init.md${errorUrlSuffix}
					`);
        }

        return originalMethod.call(this, ...args);
      }

      Object.defineProperty(decoratedWithChecker, 'name', { value: key });

      descriptor.value = decoratedWithChecker;
      Object.defineProperty(browserClass.prototype, key, descriptor);
    }
  }
  return new browserClass();
}

export { validateBrowserCallMethod };
