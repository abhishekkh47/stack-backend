"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftsTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    amount: { type: mongoose_1.default.Schema.Types.Number, required: false },
    currency: { type: mongoose_1.default.Schema.Types.String, required: false },
    giftType: { type: mongoose_1.default.Schema.Types.String, required: false },
    from: { type: mongoose_1.default.Schema.Types.String, required: false },
    deliveryDate: { type: mongoose_1.default.Schema.Types.Date, required: false },
    message: { type: mongoose_1.default.Schema.Types.String, required: false },
    templateUrl: { type: mongoose_1.default.Schema.Types.String, required: false },
    senderEmail: { type: mongoose_1.default.Schema.Types.String, required: false },
    senderMobile: { type: mongoose_1.default.Schema.Types.String, required: false },
    receiverEmail: { type: mongoose_1.default.Schema.Types.String, required: false },
    receiverNumber: { type: mongoose_1.default.Schema.Types.String, required: false },
    paymentId: { type: mongoose_1.default.Schema.Types.String, required: false },
    transferId: { type: mongoose_1.default.Schema.Types.String, required: false },
    cardId: { type: mongoose_1.default.Schema.Types.String, required: false },
    hash: { type: mongoose_1.default.Schema.Types.String, required: false },
    qrId: { type: mongoose_1.default.Schema.Types.String, required: false },
    owner: { type: mongoose_1.default.Schema.Types.String, required: false },
    receiverId: { type: mongoose_1.default.Schema.Types.String, required: false },
}, { timestamps: true });
exports.GiftsTable = mongoose_1.default.model("gifts", schema);
//# sourceMappingURL=gifts.js.map