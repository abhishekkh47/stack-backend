import mongoose from "mongoose";

import type { IQrCode, MongooseModel } from "@app/types";

export type IQrCodeSchema = MongooseModel<IQrCode> & mongoose.Document;

const schema = new mongoose.Schema<IQrCodeSchema>(
  {
    address: { type: mongoose.Schema.Types.String, required: false },
    chain: { type: mongoose.Schema.Types.String, required: false },
    email: { type: mongoose.Schema.Types.String, required: false },
    mobileNumber: { type: mongoose.Schema.Types.String, required: false },
    type: { type: mongoose.Schema.Types.String, required: false },
    hash: { type: mongoose.Schema.Types.String, required: false },
    owner: { type: mongoose.Schema.Types.String, required: false },
  },
  { timestamps: true }
);

export const QrCodeTable = mongoose.model<IQrCodeSchema>("qr-code", schema);
