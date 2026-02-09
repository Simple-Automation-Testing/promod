type PromodBrowserName = 'chrome' | 'firefox' | 'webkit' | 'edge';

type PromodBrowserConfig = {
  browserName: PromodBrowserName;
  headless?: boolean;
  args?: string[];
  executablePath?: string;
  proxy?: { server: string; bypass?: string; username?: string; password?: string };
  viewport?: { width: number; height: number };
  userAgent?: string;
  isMobile?: boolean;
  deviceScaleFactor?: number;
  locale?: string;
  timezoneId?: string;
  permissions?: string[];
  geolocation?: { latitude: number; longitude: number; accuracy?: number };
  colorScheme?: 'light' | 'dark' | 'no-preference';
  ignoreHTTPSErrors?: boolean;
};

type PwBrowserType = 'chromium' | 'firefox' | 'webkit';

type PwConfig = {
  browserType: PwBrowserType;
  launchOptions: Record<string, unknown>;
  contextOptions: Record<string, unknown>;
};

type SwdConfig = {
  browserName: string;
  capabilities: Record<string, unknown>;
};

function toPwConfig(config: PromodBrowserConfig): PwConfig {
  const { browserName } = config;

  let browserType: PwBrowserType;
  const launchOptions: Record<string, unknown> = {};
  const contextOptions: Record<string, unknown> = {};

  if (browserName === 'chrome' || browserName === 'edge') {
    browserType = 'chromium';
    if (browserName === 'edge') {
      launchOptions.channel = 'msedge';
    }
  } else if (browserName === 'firefox') {
    browserType = 'firefox';
  } else {
    browserType = 'webkit';
  }

  if (config.headless !== undefined) launchOptions.headless = config.headless;
  if (config.args) launchOptions.args = config.args;
  if (config.executablePath) launchOptions.executablePath = config.executablePath;
  if (config.proxy) launchOptions.proxy = config.proxy;

  if (config.viewport) contextOptions.viewport = config.viewport;
  if (config.userAgent) contextOptions.userAgent = config.userAgent;
  if (config.isMobile !== undefined) contextOptions.isMobile = config.isMobile;
  if (config.deviceScaleFactor !== undefined) contextOptions.deviceScaleFactor = config.deviceScaleFactor;
  if (config.locale) contextOptions.locale = config.locale;
  if (config.timezoneId) contextOptions.timezoneId = config.timezoneId;
  if (config.permissions) contextOptions.permissions = config.permissions;
  if (config.geolocation) contextOptions.geolocation = config.geolocation;
  if (config.colorScheme) contextOptions.colorScheme = config.colorScheme;
  if (config.ignoreHTTPSErrors !== undefined) contextOptions.ignoreHTTPSErrors = config.ignoreHTTPSErrors;

  return { browserType, launchOptions, contextOptions };
}

function buildChromeArgs(config: PromodBrowserConfig): string[] {
  const args: string[] = [];

  if (config.headless) args.push('--headless=new');
  if (config.args) args.push(...config.args);
  if (config.proxy) args.push(`--proxy-server=${config.proxy.server}`);
  if (config.viewport) args.push(`--window-size=${config.viewport.width},${config.viewport.height}`);
  if (config.userAgent) args.push(`--user-agent=${config.userAgent}`);
  if (config.locale) args.push(`--lang=${config.locale}`);

  return args;
}

function buildMobileEmulation(config: PromodBrowserConfig): Record<string, unknown> | undefined {
  const emulation: Record<string, unknown> = {};
  let hasDeviceMetrics = false;
  const deviceMetrics: Record<string, unknown> = {};

  if (config.userAgent) emulation.userAgent = config.userAgent;

  if (config.isMobile !== undefined) {
    deviceMetrics.mobile = config.isMobile;
    hasDeviceMetrics = true;
  }
  if (config.deviceScaleFactor !== undefined) {
    deviceMetrics.pixelRatio = config.deviceScaleFactor;
    hasDeviceMetrics = true;
  }

  if (hasDeviceMetrics) {
    if (config.viewport) {
      deviceMetrics.width = config.viewport.width;
      deviceMetrics.height = config.viewport.height;
    }
    emulation.deviceMetrics = deviceMetrics;
  }

  if (Object.keys(emulation).length === 0) return undefined;

  return emulation;
}

function buildChromeOptions(config: PromodBrowserConfig): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  const args = buildChromeArgs(config);

  if (args.length > 0) options.args = args;
  if (config.executablePath) options.binary = config.executablePath;

  const mobileEmulation = buildMobileEmulation(config);
  if (mobileEmulation) options.mobileEmulation = mobileEmulation;

  return options;
}

function buildEdgeOptions(config: PromodBrowserConfig): Record<string, unknown> {
  return buildChromeOptions(config);
}

function buildFirefoxOptions(config: PromodBrowserConfig): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  const args: string[] = [];

  if (config.headless) args.push('-headless');
  if (config.args) args.push(...config.args);

  if (args.length > 0) options.args = args;
  if (config.executablePath) options.binary = config.executablePath;

  const prefs: Record<string, unknown> = {};
  if (config.userAgent) prefs['general.useragent.override'] = config.userAgent;
  if (config.locale) prefs['intl.accept_languages'] = config.locale;

  if (Object.keys(prefs).length > 0) options.prefs = prefs;

  return options;
}

function toSwdConfig(config: PromodBrowserConfig): SwdConfig {
  const { browserName } = config;

  if (browserName === 'webkit') {
    throw new Error('Selenium WebDriver does not support WebKit. Use Playwright for WebKit testing.');
  }

  const capabilities: Record<string, unknown> = {};

  if (config.ignoreHTTPSErrors) {
    capabilities.acceptInsecureCerts = true;
  }

  let swdBrowserName: string;

  if (browserName === 'chrome') {
    swdBrowserName = 'chrome';
    const chromeOptions = buildChromeOptions(config);
    if (Object.keys(chromeOptions).length > 0) {
      capabilities['goog:chromeOptions'] = chromeOptions;
    }
  } else if (browserName === 'edge') {
    swdBrowserName = 'MicrosoftEdge';
    const edgeOptions = buildEdgeOptions(config);
    if (Object.keys(edgeOptions).length > 0) {
      capabilities['ms:edgeOptions'] = edgeOptions;
    }
  } else {
    swdBrowserName = 'firefox';
    const firefoxOptions = buildFirefoxOptions(config);
    if (Object.keys(firefoxOptions).length > 0) {
      capabilities['moz:firefoxOptions'] = firefoxOptions;
    }
  }

  return { browserName: swdBrowserName, capabilities };
}

export { toPwConfig, toSwdConfig, PromodBrowserConfig };
