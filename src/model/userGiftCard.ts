import mongoose from "mongoose";

import { IUserGiftCard, MongooseModel } from "../types";

export type IUserGiftCardSchema = MongooseModel<IUserGiftCard> &
  mongoose.Document;

const schema = new mongoose.Schema<IUserGiftCardSchema>(
  {
    uuid: {
      type: mongoose.Schema.Types.String,
      unique: true,
      required: true,
    },
    sender_name: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    sender_email: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    recieptent_email: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    issued_giftcard_order_id: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    send_on_date: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    message_text: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    amount: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    recipient_phone: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    /**
     * false - pending , true - reedemed
     */
    redeemed: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const UserGiftCardTable = mongoose.model<IUserGiftCardSchema>(
  "usergiftcards",
  schema
);
