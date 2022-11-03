import { EBankStatus } from "../types";
import { UserBanksTable } from "../model";

/**
 * @description This api is used to add bank data to userbank table
 * @param processToken
 * @param accessToken
 * @param userId
 * @param parentId
 * @param status
 * @param isDefault
 * @returns {*}
 */
export const createBank = async (
  processToken: string,
  accessToken: string,
  institutionId: string,
  userExists: any,
) => {
  const response = await UserBanksTable.create({
    userId: userExists._id,
    parentId: userExists._id,
    processorToken: processToken,
    relationshipId: null,
    accessToken: accessToken,
    status: EBankStatus.APPROVED,
    isDefault: 1,
    insId: institutionId,
  });

  return response;
};
