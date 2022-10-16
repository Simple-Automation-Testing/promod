"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seleniumWD = void 0;
const driver_1 = require("./driver");
const swd_element_1 = require("./swd_element");
const swd_client_1 = require("./swd_client");
const seleniumWD = {
    getSeleniumDriver: driver_1.getSeleniumDriver,
    browser: swd_client_1.browser,
    $: swd_element_1.$,
    $$: swd_element_1.$$,
    By: swd_element_1.By,
};
exports.seleniumWD = seleniumWD;
//# sourceMappingURL=index.js.map