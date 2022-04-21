"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    email: {
        type: mongoose_1.default.Schema.Types.String,
        required: false,
        default: null,
    },
    password: {
        type: mongoose_1.default.Schema.Types.String,
        required: false,
        default: null,
    },
    username: {
        type: mongoose_1.default.Schema.Types.String,
        required: false,
        default: null,
    },
    mobile: { type: mongoose_1.default.Schema.Types.String, required: true },
    address: { type: mongoose_1.default.Schema.Types.String, default: null },
    firstName: {
        type: mongoose_1.default.Schema.Types.String,
        required: false,
        default: null,
    },
    lastName: {
        type: mongoose_1.default.Schema.Types.String,
        required: false,
        default: null,
    },
    type: { type: mongoose_1.default.Schema.Types.Number, required: true },
    parentEmail: { type: mongoose_1.default.Schema.Types.String, default: null },
    parentMobile: { type: mongoose_1.default.Schema.Types.String, default: null },
    verificationEmailExpireAt: {
        type: mongoose_1.default.Schema.Types.String,
        description: "verification email expiry time",
        example: 1502844074211,
    },
    verificationCode: {
        type: mongoose_1.default.Schema.Types.String,
        description: "Email verification code",
        default: null,
        required: false,
    },
    tempPassword: { type: mongoose_1.default.Schema.Types.String, default: null },
    loginAttempts: { type: mongoose_1.default.Schema.Types.Number, default: 0 },
    refreshToken: { type: mongoose_1.default.Schema.Types.String, default: null },
    country: { type: mongoose_1.default.Schema.Types.String, default: null },
    city: { type: mongoose_1.default.Schema.Types.String, default: null },
    postalCode: { type: mongoose_1.default.Schema.Types.String, default: null },
    unitApt: { type: mongoose_1.default.Schema.Types.String, default: null },
    stateId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        default: null,
        ref: "state",
    },
    liquidAsset: { type: mongoose_1.default.Schema.Types.Number, default: null },
    taxIdNo: { type: mongoose_1.default.Schema.Types.String, default: null },
    taxState: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        default: null,
        ref: "state",
    },
    dob: { type: mongoose_1.default.Schema.Types.String, default: null },
}, { timestamps: true });
exports.UserTable = mongoose_1.default.model("users", schema);
//# sourceMappingURL=user.js.map