import mongoose from "mongoose";

export interface IParentChild {
  userId: mongoose.Schema.Types.ObjectId;
  contactId: string;
  accountId: string; // only available when flow is for self
  accountNumber: string; // only available when flow is for self
  frontDocumentId: string;
  backDocumentId: string;
  processorToken: string;
  accessToken: string;
  proofOfAddressId: string;
  pushTransferId: string;
  kycDocumentId: string;
  institutionId: string;
  firstChildId: mongoose.Schema.Types.ObjectId;
  teens: [];
}
