"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETRANSFER = exports.EUserType = exports.ALLOWED_LOGIN_ATTEMPTS = void 0;
exports.ALLOWED_LOGIN_ATTEMPTS = 3;
var EUserType;
(function (EUserType) {
    EUserType[EUserType["TEEN"] = 1] = "TEEN";
    EUserType[EUserType["PARENT"] = 2] = "PARENT";
})(EUserType = exports.EUserType || (exports.EUserType = {}));
var ETRANSFER;
(function (ETRANSFER) {
    ETRANSFER[ETRANSFER["ACH"] = 1] = "ACH";
    ETRANSFER[ETRANSFER["WIRE"] = 2] = "WIRE";
})(ETRANSFER = exports.ETRANSFER || (exports.ETRANSFER = {}));
//# sourceMappingURL=user.js.map