import { DeviceTokenService } from "@app/services/v1/index";
import {
  createContributions,
  getPrimeTrustJWTToken,
  NOTIFICATION,
  NOTIFICATION_KEYS,
} from "@app/utility";
import {
  TransactionTable,
  UserTable,
  UserActivityTable,
  UserBanksTable,
} from "@app/model";
import moment from "moment";
import {
  ETransactionStatus,
  ETransactionType,
  ERECURRING,
  EUserType,
  EAction,
  EStatus,
  messages,
} from "@app/types";

export const recurringDepositHandler = async () => {
  console.log("==========Start Cron For Recurring=============");
  let token = await getPrimeTrustJWTToken();
  let users: any = await UserTable.aggregate([
    {
      $match: {
        $and: [
          { isRecurring: { $exists: true } },
          { isRecurring: { $nin: [0, 1] } },
        ],
      },
    },
    {
      $lookup: {
        from: "parentchild",
        localField: "_id",
        foreignField: "teens.childId",
        as: "parentChild",
      },
    },
    { $unwind: { path: "$parentChild", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "parentchild",
        localField: "_id",
        foreignField: "firstChildId",
        as: "self",
      },
    },
    { $unwind: { path: "$self", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$_id",
        doc: {
          $first: "$$ROOT",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: "$doc",
      },
    },
  ]).exec();
  if (users.length > 0) {
    users = users.filter((x) => x.parentChild || x.self);
    let todayDate = moment().startOf("day").unix();
    let transactionArray = [];
    let mainArray = [];
    let activityArray = [];
    let accountIdDetails: any;
    for await (let user of users) {
      accountIdDetails = await user.parentChild?.teens.find(
        (x: any) => x.childId.toString() == user._id.toString()
      );
      if (!accountIdDetails && user.self) {
        accountIdDetails =
          (await user.self.userId.toString()) == user._id.toString() &&
          user.self;
        if (!accountIdDetails) {
          continue;
        }
      }
      let selectedDate = moment(user.selectedDepositDate).startOf("day").unix();
      if (selectedDate <= todayDate) {
        const id =
          user.type == EUserType.SELF
            ? user.self.userId
            : user.parentChild.userId;
        const userInfo = await UserBanksTable.findOne({
          $or: [{ userId: id }, { parentId: id }],
          $and: [{ isDefault: 1 }],
        });
        if (!userInfo || (userInfo && !userInfo.processorToken)) {
          continue;
        }
        let contactId =
          user.type == EUserType.SELF
            ? user.self.contactId
            : user.parentChild.contactId;
        let contributionRequest = {
          type: "contributions",
          attributes: {
            "account-id": accountIdDetails.accountId,
            "contact-id": contactId,
            "funds-transfer-method": {
              "funds-transfer-type": "ach",
              "ach-check-type": "personal",
              "contact-id": contactId,
              "plaid-processor-token": userInfo.processorToken,
            },
            amount: user.selectedDeposit,
          },
        };
        let contributions: any = await createContributions(
          token.data,
          contributionRequest
        );
        if (contributions.status == 400) {
          continue;
        } else {
          let activityData = {
            userId: user._id,
            userType:
              user.type == EUserType.SELF ? EUserType.SELF : EUserType.TEEN,
            message: `${messages.RECURRING_DEPOSIT} $${user.selectedDeposit}`,
            currencyType: null,
            currencyValue: user.selectedDeposit,
            action: EAction.DEPOSIT,
            resourceId: contributions.data.included[0].id,
            status: EStatus.PROCESSED,
          };
          activityArray.push(activityData);
          let transactionData = {
            assetId: null,
            cryptoId: null,
            accountId: accountIdDetails.accountId,
            type: ETransactionType.DEPOSIT,
            recurringDeposit: true,
            settledTime: moment().unix(),
            amount: user.selectedDeposit,
            amountMod: null,
            userId: user._id,
            parentId:
              user.type == EUserType.SELF
                ? user.self.userId
                : user.parentChild.userId,
            status: ETransactionStatus.PENDING,
            executedQuoteId: contributions.data.included[0].id,
            unitCount: null,
          };
          transactionArray.push(transactionData);
          let bulWriteOperation = {
            updateOne: {
              filter: { _id: user._id },
              update: {
                $set: {
                  selectedDepositDate: moment()
                    .utc()
                    .startOf("day")
                    .add(
                      user.isRecurring == ERECURRING.WEEKLY
                        ? 7
                        : user.isRecurring == ERECURRING.MONTLY
                        ? 1
                        : user.isRecurring == ERECURRING.DAILY
                        ? 24
                        : 0,
                      user.isRecurring == ERECURRING.WEEKLY
                        ? "days"
                        : user.isRecurring == ERECURRING.MONTLY
                        ? "months"
                        : user.isRecurring == ERECURRING.DAILY
                        ? "hours"
                        : "day"
                    ),
                },
              },
            },
          };
          await mainArray.push(bulWriteOperation);
        }
      }
    }
    await UserActivityTable.insertMany(activityArray);
    await TransactionTable.insertMany(transactionArray);
    await UserTable.bulkWrite(mainArray);
  }
  return true;
};
