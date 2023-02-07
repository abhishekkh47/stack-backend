import { UserTable } from "../../model";
import { ObjectId } from "mongodb";

class UserService {
  /**
   * @description Get Profile of users
   * @param userId
   */
  public async getProfile(userId: string) {
    let data = (
      await UserTable.aggregate([
        { $match: { _id: new ObjectId(userId) } },
        {
          $lookup: {
            from: "states",
            localField: "stateId",
            foreignField: "_id",
            as: "state",
          },
        },
        { $unwind: { path: "$state", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "parentchild",
            localField: "_id",
            foreignField: "userId",
            as: "parentchild",
          },
        },
        { $unwind: { path: "$parentchild", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "parentchild.firstChildId",
            foreignField: "_id",
            as: "childInfo",
          },
        },
        { $unwind: { path: "$childInfo", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "user-refferals",
            localField: "_id",
            foreignField: "userId",
            as: "lifeTimeReferral",
          },
        },
        {
          $unwind: {
            path: "$lifeTimeReferral",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            isParentApproved: 0,
            initialDeposit: 0,
            isKycDocumentUploaded: {
              $cond: {
                if: { $ne: ["$parentchild.kycDocumentId", null] },
                then: 1,
                else: 0,
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            email: 1,
            kycMessages: 1,
            mobile: 1,
            address: 1,
            firstName: 1,
            lastName: 1,
            type: 1,
            isParentApproved: 1,
            parentMobile: 1,
            parentEmail: 1,
            country: 1,
            "state._id": 1,
            "state.name": 1,
            "state.shortName": 1,
            lifeTimeReferralCount: {
              $ifNull: ["$lifeTimeReferral.referralCount", 0],
            },
            childMobile: {
              $ifNull: ["$childInfo.mobile", null],
            },
            referralCode: 1,
            screenStatus: 1,
            city: 1,
            postalCode: 1,
            unitApt: 1,
            taxIdNo: 1,
            taxState: 1,
            status: 1,
            dob: 1,
            profilePicture: 1,
            isRecurring: 1,
            selectedDeposit: 1,
            selectedDepositDate: 1,
            isNotificationOn: 1,
            isPhoneVerified: 1,
            isKycDocumentUploaded: 1,
            initialDeposit: 1,
          },
        },
      ]).exec()
    )[0];

    if (!data) {
      throw Error("Invalid user ID entered.");
    }
    return { data };
  }
}

export default new UserService();
