"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playwrightWD = void 0;
const driver_1 = require("./driver");
const pw_element_1 = require("./pw_element");
const pw_client_1 = require("./pw_client");
const playwrightWD = {
    getDriver: driver_1.getDriver,
    browser: pw_client_1.browser,
    $: pw_element_1.$,
    $$: pw_element_1.$$,
    PromodElement: pw_element_1.PromodElement,
    PromodElements: pw_element_1.PromodElements,
};
exports.playwrightWD = playwrightWD;
//# sourceMappingURL=index.js.map