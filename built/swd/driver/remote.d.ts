import { WebDriver } from 'selenium-webdriver';
declare const getDriver: (config: any) => Promise<WebDriver>;
export { getDriver };
