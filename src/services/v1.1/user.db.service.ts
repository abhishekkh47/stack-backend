import { ParentChildTable } from "../../model/parentChild";
import { UserTable } from "../../model/user";

class UserDBService {
  /**
   * @description create account for user
   */
  public async createUserAccount(updateUser: any, mobile: any) {
    const createObj = {
      email: updateUser.email,
      mobile: mobile,
      firstName: updateUser.firstName,
      lastName: updateUser.lastName,
      referralCode: updateUser.referralCode,
      dob: updateUser.dob,
      type: updateUser.type,
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
