export type BaseConf = {
	[key: string]: any;
	// Selenium drivers options
	seleniumServerJar?: string;
	localSeleniumStandaloneOpts?: {
		port?: number | string;
		args?: string[];
		jvmArgs?: string[];
	};
	chromeDriver?: string;
	geckoDriver?: string;

	seleniumAddress?: string;
	seleniumSessionId?: string;
	// Browser capabilities
	capabilities?: {
		[key: string]: any;
		browserName?: string;
	};
	// Opts
	baseUrl?: string;
}
