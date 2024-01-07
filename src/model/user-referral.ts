import mongoose from "mongoose";

import type { IUserReferral, MongooseModel } from "@app/types";

export type IUserReferralSchema = MongooseModel<any> & mongoose.Document;

const schema = new mongoose.Schema<IUserReferralSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    referralCount: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    senderName: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    referralArray: [
      {
        referredId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
        /**
         * 1 - sms and 2 - qr code
         */
        type: {
          type: mongoose.Schema.Types.Number,
          default: 1,
          required: true,
        },
        coinsGifted: {
          type: mongoose.Schema.Types.Number,
          required: true,
        },
        receiverName: {
          type: mongoose.Schema.Types.String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export const UserReferralTable = mongoose.model<IUserReferralSchema>(
  "user-refferal",
  schema
);
