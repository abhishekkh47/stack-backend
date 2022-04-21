"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = exports.EStatus = exports.EAction = void 0;
var EAction;
(function (EAction) {
    EAction[EAction["DEPOSIT"] = 1] = "DEPOSIT";
    EAction[EAction["WITHDRAW"] = 2] = "WITHDRAW";
    EAction[EAction["BUY_CRYPTO"] = 3] = "BUY_CRYPTO";
    EAction[EAction["SELL_CRYPTO"] = 4] = "SELL_CRYPTO";
})(EAction = exports.EAction || (exports.EAction = {}));
var EStatus;
(function (EStatus) {
    EStatus[EStatus["PENDING"] = 1] = "PENDING";
    EStatus[EStatus["PROCESSED"] = 2] = "PROCESSED";
    EStatus[EStatus["CANCELLED"] = 3] = "CANCELLED";
})(EStatus = exports.EStatus || (exports.EStatus = {}));
exports.messages = {
    DEPOSIT: "Requested one time deposit",
    WITHDRAW: "Requested one time withdrawal",
    BUY: "Requested to buy crypto",
    SELL: "Requested to sell crypto",
};
//# sourceMappingURL=useractivity.js.map