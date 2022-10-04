export interface IBankAccount {
 userId: string;
 parentId: string;
 isDefault: number;
 processorToken: string;
 accessToken: string;
 status: number;
 insId: string,
}
export enum EAccountStatus {
 QUEUED = 0,
 APPROVED = 2,
 PENDING = 1
}
