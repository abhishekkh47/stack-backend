"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOtp = exports.saveOtp = void 0;
const moment_1 = __importDefault(require("moment"));
const OTP_MAPPING = {};
const saveOtp = async (id, otp, validTill = (0, moment_1.default)().add(10, "minutes").toDate()) => {
    OTP_MAPPING[id] = {
        validTill,
        value: otp,
    };
    console.log(`Otp for id ${id} is ${otp}`);
    return {
        success: true,
    };
};
exports.saveOtp = saveOtp;
const validateOtp = (id, value) => {
    const mapping = OTP_MAPPING[id];
    if (!mapping) {
        throw new Error("Invalid otp");
    }
    if (mapping.value !== value) {
        throw new Error("Invalid otp");
    }
    const isExpired = (0, moment_1.default)().isAfter((0, moment_1.default)(mapping.validTill));
    if (isExpired) {
        delete OTP_MAPPING[id];
        throw new Error("Otp expired");
    }
    delete OTP_MAPPING[id];
    return {
        success: true,
    };
};
exports.validateOtp = validateOtp;
//# sourceMappingURL=notification.js.map