"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Browser = exports.playwrightWD = exports.seleniumWD = void 0;
const swd_1 = require("./swd");
Object.defineProperty(exports, "seleniumWD", { enumerable: true, get: function () { return swd_1.seleniumWD; } });
const pw_1 = require("./pw");
Object.defineProperty(exports, "playwrightWD", { enumerable: true, get: function () { return pw_1.playwrightWD; } });
__exportStar(require("./swd/config"), exports);
__exportStar(require("./pw/config"), exports);
var swd_client_1 = require("./swd/swd_client");
Object.defineProperty(exports, "Browser", { enumerable: true, get: function () { return swd_client_1.Browser; } });
//# sourceMappingURL=index.js.map