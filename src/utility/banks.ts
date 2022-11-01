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
  childId: any,
  defaultFlag: any
) => {
  const response = await UserBanksTable.create({
    userId: childId,
    parentId: userExists._id,
    processorToken: processToken,
    relationshipId: null,
    accessToken: accessToken,
    status: EBankStatus.APPROVED,
    isDefault: defaultFlag,
    insId: institutionId,
  });

  return response;
};
