"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActivityTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    message: {
        type: mongoose_1.default.Schema.Types.String,
        default: null,
    },
    resourceId: {
        type: mongoose_1.default.Schema.Types.String,
        default: null,
    },
    userType: {
        type: mongoose_1.default.Schema.Types.Number,
        required: true,
    },
    action: {
        type: mongoose_1.default.Schema.Types.Number,
        required: true,
    },
    status: {
        type: mongoose_1.default.Schema.Types.Number,
        required: true,
    },
    currencyValue: {
        type: mongoose_1.default.Schema.Types.Number,
        required: true,
    },
    currencyType: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "crypto",
        default: null,
    },
}, { timestamps: true });
exports.UserActivityTable = mongoose_1.default.model("useractivity", schema);
//# sourceMappingURL=useractivity.js.map