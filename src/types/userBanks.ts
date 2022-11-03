export interface IBankAccount {
  userId: string;
  parentId: string;
  isDefault: number;
  processorToken: string;
  accessToken: string;
  status: number;
  insId: string;
  relationshipId: string;
}
export enum EBankStatus {
  QUEUED = 0,
  APPROVED = 2,
  PENDING = 1,
}
