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
  UserCommunityTable,
  WeeklyJourneyResultTable,
} from "@app/model";
import { EUserType, EUSERSTATUS } from "@app/types";
import { UserDBService } from "../v4";
import userDbService from "../v4/user.db.service";

class UserService {
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
      await WeeklyJourneyResultTable.deleteMany(otherRecordsQuery);
      await TransactionTable.deleteMany(otherRecordsQuery);
      await UserActivityTable.deleteMany(otherRecordsQuery);
      await BusinessProfileTable.deleteMany(otherRecordsQuery);
      await UserCommunityTable.deleteMany(otherRecordsQuery);
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
