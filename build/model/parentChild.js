"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentChildTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    contactId: {
        type: mongoose_1.default.Schema.Types.String,
        default: null,
    },
    kycDocumentId: {
        type: mongoose_1.default.Schema.Types.String,
        default: null,
    },
    frontDocumentId: {
        type: mongoose_1.default.Schema.Types.String,
        default: null,
    },
    backDocumentId: {
        type: mongoose_1.default.Schema.Types.String,
        default: null,
    },
    firstChildId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    teens: [
        {
            childId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "users",
                required: true,
            },
            accountId: {
                type: mongoose_1.default.Schema.Types.String,
                default: null,
            },
            pushTransferId: {
                type: mongoose_1.default.Schema.Types.String,
                unique: true,
                default: null,
            },
            accountNumber: {
                type: mongoose_1.default.Schema.Types.String,
                unique: true,
                default: null,
            },
        },
    ],
}, { timestamps: true });
exports.ParentChildTable = mongoose_1.default.model("parentchild", schema, "parentchild");
//# sourceMappingURL=parentChild.js.map