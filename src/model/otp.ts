import mongoose from "mongoose";

import type { IOtp, MongooseModel } from "../types";

export type IOtpSchema = MongooseModel<IOtp> & mongoose.Document;

const schema = new mongoose.Schema<IOtpSchema>(
  {
    receiverMobile: { type: mongoose.Schema.Types.String, required: true },
    /**
     * 1 - verified and 0 - not verified
     */
    isVerified: { type: mongoose.Schema.Types.Number, default: 0 },
    code: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    message: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    /**
     * 1 - sign up, 2 - change cell number and 3 - reset password
     */
    type: { type: mongoose.Schema.Types.Number, required: true },
  },
  { timestamps: true }
);

export const OtpTable = mongoose.model<IOtpSchema>("otp", schema);
