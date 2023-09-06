import {
  DeletedUserTable,
  DeviceToken,
  Notification,
  QuizQuestionResult,
  QuizResult,
  TransactionTable,
  UserActivityTable,
  UserBanksTable,
  UserTable,
  ParentChildTable,
  BusinessProfileTable,
} from "@app/model";
import {
  convertDateToTimeZone,
  getDaysBetweenDates,
  formattedDate,
  ALL_NULL_5_DAYS,
} from "@app/utility";
import { ObjectId } from "mongodb";
import { EUserType, EUSERSTATUS } from "@app/types";
import { UserDBService } from "../v4";
import userDbService from "../v4/user.db.service";

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
            from: "business-profiles",
            localField: "_id",
            foreignField: "userId",
            as: "businessProfile",
          },
        },
        {
          $unwind: {
            path: "$businessProfile",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "streak_goals",
            localField: "streakGoal",
            foreignField: "_id",
            as: "streakGoal",
          },
        },
        {
          $unwind: {
            path: "$streakGoal",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "parentchild",
            localField: "_id",
            foreignField: "userId",
            as: "parentchild",
          },
        },
        {
          $unwind: { path: "$parentchild", preserveNullAndEmptyArrays: true },
        },
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
            isKycSuccess: false,
            isBankDetail: false,
          },
        },
        {
          $project: {
            _id: 1,
            email: 1,
            kycMessages: 1,
            mobile: 1,
            isKycSuccess: 1,
            isBankDetail: 1,
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
            streakGoal: {
              _id: "$streakGoal._id",
              day: "$streakGoal.day",
            },
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
            quizCoins: 1,
            preLoadedCoins: 1,
            xpPoints: 1,
            timezone: 1,
            streak: 1,
          },
        },
      ]).exec()
    )[0];
    if (!data) {
      throw Error("Invalid user ID entered.");
    }
    if (data.streak) {
      const currentDate = convertDateToTimeZone(new Date(), data.timezone);
      const { year, month, day } = data.streak?.updatedDate;
      const isFirstStreak = day === 0;
      const startDate = formattedDate(year, month, day);
      const diffDays = getDaysBetweenDates(startDate, currentDate.date);
      if (!(isFirstStreak || diffDays <= 1)) {
        const endDate = new Date(currentDate.date);
        let previousDate: any = endDate.setDate(endDate.getDate() - 1);
        previousDate = convertDateToTimeZone(
          new Date(previousDate),
          data.timezone
        );
        const { last5days, isStreakInActive5Days } =
          UserDBService.modifyLast5DaysStreaks(
            diffDays,
            data.streak.last5days,
            ALL_NULL_5_DAYS,
            false
          );
        const streak = {
          current: 0,
          longest: data.streak.longest,
          updatedDate: previousDate,
          isStreakInActive5Days,
          last5days,
        };
        let updateStreakQuery: any = {
          streak,
        };
        if (isStreakInActive5Days) {
          updateStreakQuery = {
            ...updateStreakQuery,
            streakGoal: null,
          };
        }
        await UserTable.findOneAndUpdate(
          { _id: data._id },
          {
            $set: updateStreakQuery,
          },
          { upsert: true }
        );
      }
      const achievements = UserDBService.getUserStreaksAchievements(
        data.streak.longest
      );
      data = { ...data, achievements };
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

  /**
   * @description This service is used to delete all the user related information
   * @param userId
   * @param zohoAccessToken
   * @param primeTrustToken
   */
  public async deleteUserData(
    userDetails: any,
    zohoAccessToken: string,
    primeTrustToken: string
  ) {
    try {
      let parentChildRecord: any = await ParentChildTable.findOne({
        $or: [
          { userId: userDetails._id },
          { "teens.childId": userDetails._id },
        ],
      });
      const teenIds = parentChildRecord
        ? parentChildRecord.teens.map((x) => x.childId)
        : [];
      let accountIds = parentChildRecord
        ? parentChildRecord.teens.map((x) => x.accountId)
        : [];
      /**
       * Consider Teen Flow first
       */
      let otherRecordsQuery = {};
      let userQuery = {};

      if (userDetails.type == EUserType.PARENT) {
        otherRecordsQuery = { ...otherRecordsQuery, userId: { $in: teenIds } };
        teenIds.push(userDetails._id);
        userQuery = { ...userQuery, _id: { $in: teenIds } };
      } else {
        if (parentChildRecord) {
          if (parentChildRecord.teens.length === 1) {
            otherRecordsQuery = {
              ...otherRecordsQuery,
              userId: { $in: teenIds },
            };
            teenIds.push(parentChildRecord.userId);
            userQuery = { ...userQuery, _id: { $in: teenIds } };
          } else {
            if (
              parentChildRecord.firstChildId.toString() ===
              userDetails._id.toString()
            ) {
              let otherTeen = parentChildRecord.teens.find(
                (x) =>
                  x.childId.toString() !==
                  parentChildRecord.firstChildId.toString()
              );
              console.log(otherTeen, "otherTeen");
              if (otherTeen) {
                await ParentChildTable.findOneAndUpdate(
                  { _id: parentChildRecord._id },
                  {
                    $set: {
                      firstChildId: otherTeen.childId,
                    },
                  }
                );
              }
            }
            let filteredAccount = parentChildRecord.teens.find(
              (x) => x.childId.toString() === userDetails._id.toString()
            );
            otherRecordsQuery = {
              ...otherRecordsQuery,
              userId: userDetails._id,
            };
            accountIds =
              userDetails.type == EUserType.TEEN
                ? filteredAccount
                  ? [filteredAccount.accountId]
                  : null
                : [parentChildRecord.accountId];
            userQuery = { ...userQuery, _id: userDetails._id };
            await ParentChildTable.findOneAndUpdate(
              { _id: parentChildRecord._id },
              {
                $pull: {
                  teens: {
                    childId: userDetails._id,
                  },
                },
              },
              { new: true }
            );
          }
        } else {
          teenIds.push(userDetails._id);
          otherRecordsQuery = {
            ...otherRecordsQuery,
            userId: { $in: teenIds },
          };
          userQuery = { ...userQuery, _id: { $in: teenIds } };
        }
      }
      accountIds = accountIds.filter((data) => data);
      if (accountIds.length > 0) {
        if (
          userDetails.type !== EUserType.TEEN &&
          userDetails.status === EUSERSTATUS.KYC_DOCUMENT_VERIFIED
        ) {
          await userDbService.updatePTAccountsToPendingClosure(
            primeTrustToken,
            accountIds
          );
        } else {
          let parentAccount = await UserTable.findOne({
            _id: parentChildRecord.userId,
          });
          if (parentAccount.status === EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
            await userDbService.updatePTAccountsToPendingClosure(
              primeTrustToken,
              accountIds
            );
          }
        }
      }
      /**
       * Find the user query and get emails
       */
      const users = await UserTable.find(userQuery);
      let emails = users.map((x) => x.email);
      emails = [...new Set(emails)];
      await UserDBService.searchAndDeleteZohoAccounts(emails, zohoAccessToken);
      await UserBanksTable.deleteMany(otherRecordsQuery);
      await DeviceToken.deleteMany(otherRecordsQuery);
      await Notification.deleteMany(otherRecordsQuery);
      await QuizQuestionResult.deleteMany(otherRecordsQuery);
      await QuizResult.deleteMany(otherRecordsQuery);
      await TransactionTable.deleteMany(otherRecordsQuery);
      await UserActivityTable.deleteMany(otherRecordsQuery);
      await BusinessProfileTable.deleteMany(otherRecordsQuery);
      await UserTable.deleteMany(userQuery);
      await ParentChildTable.deleteMany(otherRecordsQuery);
      /**
       * Store Deleted Users in a separate document
       */
      await DeletedUserTable.create({
        email: userDetails.email,
        type: userDetails.type,
        fullName: userDetails.lastName
          ? userDetails.firstName + " " + userDetails.lastName
          : userDetails.firstName,
        mobile: userDetails.mobile ? userDetails.mobile : null,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new UserService();
