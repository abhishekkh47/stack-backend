import { ParentChildTable } from "./../../model/parentChild";
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
            from: "userbanks",
            localField: "_id",
            foreignField: "userId",
            as: "bankDetails",
          },
        },
        { $unwind: { path: "$bankDetails", preserveNullAndEmptyArrays: true } },
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
            isKycSuccess: {
              $cond: {
                if: { $ne: ["$parentchild.status", 3] },
                then: true,
                else: false,
              },
            },
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
            isKycSuccess: 1,
            firstName: 1,
            lastName: 1,
            type: 1,
            isParentApproved: 1,
            parentMobile: 1,
            parentEmail: 1,
            bankDetails: 1,
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
            unlockRewardTime: 1,
            isGiftedCrypto: 1,
            isEnteredParentNumber: 1,
            screenStatus: 1,
            city: 1,
            postalCode: 1,
            unitApt: 1,
            taxIdNo: 1,
            taxState: 1,
            status: 1,
            isOnboardingQuizCompleted: 1,
            dob: 1,
            profilePicture: 1,
            isRecurring: 1,
            selectedDeposit: 1,
            selectedDepositDate: 1,
            isNotificationOn: 1,
            isPhoneVerified: 1,
            isKycDocumentUploaded: 1,
            initialDeposit: 1,
            isRewardDeclined: 1,
          },
        },
      ]).exec()
    )[0];

    if (!data) {
      throw Error("Invalid user ID entered.");
    }
    return { data };
  }

  /**
   * @description get parent and child info
   * @param userId
   */
  public async getParentChildInfo(userId: string) {
    const queryFindParentChildData = [
      {
        $match: { $or: [{ userId: userId }, { "teens.childId": userId }] },
      },
      {
        $lookup: {
          from: "users",
          localField: "teens.childId",
          foreignField: "_id",
          as: "childInfo",
        },
      },
      {
        $unwind: {
          path: "$childInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          unlockRewardTime: "$childInfo.unlockRewardTime",
          childId: "$childInfo._id",
          isGiftedCrypto: "$childInfo.isGiftedCrypto",
          isRewardDeclined: "$childInfo.isRewardDeclined",
        },
      },
      {
        $project: {
          userId: 1,
          teens: 1,
          firstChildId: 1,
          accountId: 1,
          unlockRewardTime: 1,
          isRewardDeclined: 1,
          childId: 1,
          isGiftedCrypto: 1,
        },
      },
    ];
    let parentChildDetails: any = await ParentChildTable.aggregate(
      queryFindParentChildData
    ).exec();

    parentChildDetails =
      parentChildDetails.length > 0 ? parentChildDetails[0] : null;

    return parentChildDetails;
  }
}

export default new UserService();
