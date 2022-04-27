import mongoose from "mongoose";

export interface IParentChild {
  userId: mongoose.Schema.Types.ObjectId;
  contactId: string;
  frontDocumentId: string;
  backDocumentId: string;
  processorToken: string;
  accessToken: string;
  proofOfAddressId: string;
  kycDocumentId: string;
  firstChildId: mongoose.Schema.Types.ObjectId;
  teens: [];
}
