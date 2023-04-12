import { makeUniqueReferalCode } from "@app/utility";
import { ParentChildTable, UserTable } from "@app/model";

class UserDBService {
  /**
   * @description create account for user
   */
  public async createUserAccount(updateUser: any, mobile: any) {
    const uniqueReferralCode = await makeUniqueReferalCode();
    const createObj = {
      email: updateUser.email,
      mobile: mobile,
      firstName: updateUser.firstName,
      lastName: updateUser.lastName,
      referralCode: updateUser.referralCode
        ? updateUser.referralCode
        : uniqueReferralCode,
      dob: updateUser.dob,
      type: updateUser.type,
      isPhoneVerified: updateUser.isPhoneVerified,
    };

    let createUserRecord = await UserTable.create(createObj);

    await ParentChildTable.create({
      userId: createUserRecord._id,
      firstChildId: createUserRecord._id,
    });

    return createUserRecord;
  }
}

export default new UserDBService();
