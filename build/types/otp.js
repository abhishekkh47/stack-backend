"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpTimeLimit = exports.EOTPVERIFICATION = exports.EOTPTYPE = void 0;
var EOTPTYPE;
(function (EOTPTYPE) {
    EOTPTYPE[EOTPTYPE["SIGN_UP"] = 1] = "SIGN_UP";
    EOTPTYPE[EOTPTYPE["CHANGE_MOBILE"] = 2] = "CHANGE_MOBILE";
    EOTPTYPE[EOTPTYPE["RESET_PASSWORD"] = 3] = "RESET_PASSWORD";
})(EOTPTYPE = exports.EOTPTYPE || (exports.EOTPTYPE = {}));
var EOTPVERIFICATION;
(function (EOTPVERIFICATION) {
    EOTPVERIFICATION[EOTPVERIFICATION["VERIFIED"] = 1] = "VERIFIED";
    EOTPVERIFICATION[EOTPVERIFICATION["NOTVERIFIED"] = 0] = "NOTVERIFIED";
})(EOTPVERIFICATION = exports.EOTPVERIFICATION || (exports.EOTPVERIFICATION = {}));
exports.otpTimeLimit = 5.0;
//# sourceMappingURL=otp.js.map