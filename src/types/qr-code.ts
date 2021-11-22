import { MongooseModel } from "./db";

export interface ICreateQrCodePayload {
  address: string;
  chain: string;
  email: string;
  mobileNumber: string;
  type: string;
}

export interface IQrCode extends ICreateQrCodePayload {
  hash: string;
  owner: string;
}
export type IQrCodeModel = MongooseModel<IQrCode>;
