import mongoose from "mongoose";

import type { IUser, MongooseModel } from "@app/types";

export type IUserSchema = MongooseModel<IUser> & mongoose.Document;

const schema = new mongoose.Schema<IUserSchema>(
  {
    email: { type: mongoose.Schema.Types.String, required: true },
    password: { type: mongoose.Schema.Types.String, required: true },
    username: { type: mongoose.Schema.Types.String, required: true },
    address: { type: mongoose.Schema.Types.String, default: null },
      verificationEmailExpireAt: {
          type: mongoose.Schema.Types.String,
          description: 'verification email expiry time',
          example: 1502844074211
      },
      verificationCode:{
          type: mongoose.Schema.Types.String,
          description: 'Email verification code',
          default: null,
          required: false
      }

  },
  { timestamps: true }
);

export const UserTable = mongoose.model<IUserSchema>("users", schema);
