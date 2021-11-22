import mongoose from "mongoose";

import type { IGift, MongooseModel } from "@app/types";

export type IGiftSchema = MongooseModel<IGift> & mongoose.Document;

const schema = new mongoose.Schema<IGiftSchema>(
  {
    amount: { type: mongoose.Schema.Types.Number, required: false },
    currency: { type: mongoose.Schema.Types.String, required: false },
    giftType: { type: mongoose.Schema.Types.String, required: false },
    from: { type: mongoose.Schema.Types.String, required: false },
    deliveryDate: { type: mongoose.Schema.Types.Date, required: false },
    message: { type: mongoose.Schema.Types.String, required: false },
    templateUrl: { type: mongoose.Schema.Types.String, required: false },
    senderEmail: { type: mongoose.Schema.Types.String, required: false },
    senderMobile: { type: mongoose.Schema.Types.String, required: false },
    receiverEmail: { type: mongoose.Schema.Types.String, required: false },
    receiverNumber: { type: mongoose.Schema.Types.String, required: false },
    paymentId: { type: mongoose.Schema.Types.String, required: false },
    transferId: { type: mongoose.Schema.Types.String, required: false },
    cardId: { type: mongoose.Schema.Types.String, required: false },
    hash: { type: mongoose.Schema.Types.String, required: false },
    qrId: { type: mongoose.Schema.Types.String, required: false },
    owner: { type: mongoose.Schema.Types.String, required: false },
    receiverId: { type: mongoose.Schema.Types.String, required: false },
  },
  { timestamps: true }
);

export const GiftsTable = mongoose.model<IGiftSchema>("gifts", schema);
