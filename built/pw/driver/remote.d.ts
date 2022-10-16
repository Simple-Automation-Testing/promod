import { Browser, BrowserServer } from 'playwright';
declare const _getDriver: (config: any) => Promise<{
    driver: Browser;
    server?: BrowserServer;
}>;
export { _getDriver };
