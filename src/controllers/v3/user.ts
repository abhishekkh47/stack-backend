import { TradingService } from "../../services/v3/index";
import { EGIFTSTACKCOINSSETTING } from "./../../types/user";
import moment from "moment";
import BaseController from "../base";
import { EUSERSTATUS, EUserType, HttpMethod } from "../../types";
import { TransactionDBService, UserService } from "../../services/v3";
import { Auth, PrimeTrustJWT } from "../../middleware";
import {
  UserTable,
  TransactionTable,
  UserBanksTable,
  AdminTable,
  CryptoTable,
} from "../../model";
import { CMS_LINKS } from "../../utility/constants";
import { Route } from "../../utility";
import { validationsV3 } from "../../validations/v3/apiValidation";

class UserController extends BaseController {
  /**
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/get-profile/:id", method: HttpMethod.GET })
  @Auth()
  public async getProfile(ctx: any) {
    const { id } = ctx.request.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id))
      return this.BadRequest(ctx, "Enter valid ID.");
    let { data } = await UserService.getProfile(id);

    const checkIntitalDepositDone = await TransactionTable.findOne({
      $or: [{ parentId: id }, { userId: id }],
      intialDeposit: true,
    });

    if (data) {
      if (checkIntitalDepositDone) {
        data.initialDeposit = 1;
      }
      const checkParentExists = await UserTable.findOne({
        mobile: data.parentMobile ? data.parentMobile : data.mobile,
      });
      const checkBankExists =
        checkParentExists?._id &&
        (await UserBanksTable.find({
          userId: checkParentExists._id,
        }));
      if (
        !checkParentExists ||
        (checkParentExists &&
          checkParentExists.status !== EUSERSTATUS.KYC_DOCUMENT_VERIFIED)
      ) {
        data.isParentApproved = 0;
      } else {
        data.isParentApproved = 1;
      }
      if (
        !checkParentExists ||
        (checkParentExists && checkBankExists.length == 0)
      ) {
        data.isRecurring = 0;
      } else if (checkBankExists.length > 0) {
        if (data.isRecurring == 1 || data.isRecurring == 0) {
          data.isRecurring = 1;
        }
      }
    }

    data = {
      ...data,
      terms: CMS_LINKS.TERMS,
      amcPolicy: CMS_LINKS.AMC_POLICY,
      privacy: CMS_LINKS.PRIVACY_POLICY,
      ptUserAgreement: CMS_LINKS.PRIME_TRUST_USER_AGREEMENT,
    };

    return this.Ok(ctx, data, true);
  }

  /**
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/claim-reward", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async claimYourReward(ctx: any) {
    try {
      const user = ctx.request.user;
      const admin = await AdminTable.findOne({});
      const userExists = await UserTable.findOne({ _id: user._id });
      const jwtToken = ctx.request.primeTrustToken;
      if (!userExists || (userExists && userExists.type !== EUserType.TEEN)) {
        return this.BadRequest(ctx, "User Not Found");
      }
      if (userExists.unlockRewardTime) {
        return this.BadRequest(ctx, "You already unlocked the reward");
      }
      let transactionExists = await TransactionTable.findOne({
        userId: userExists._id,
      });

      const parentChildDetails = await UserService.getParentChildInfo(
        userExists._id
      );
      const checkParentInfo =
        parentChildDetails &&
        (await UserTable.findOne({
          _id: parentChildDetails.userId,
        }));

      const checkParentBankExists =
        parentChildDetails &&
        (await UserBanksTable.findOne({
          $or: [
            { userId: parentChildDetails.userId },
            { parentId: parentChildDetails.userId },
          ],
        }));
      if (
        admin.giftCryptoSetting == 1 &&
        userExists.isGiftedCrypto == 0 &&
        !transactionExists
      ) {
        let crypto = await CryptoTable.findOne({ symbol: "BTC" });
        await TransactionDBService.createBtcGiftedTransaction(
          userExists._id,
          crypto,
          admin
        );
        const userData = await UserTable.findOne({ _id: userExists._id });
        return this.Ok(ctx, {
          message: "Reward Claimed Successfully",
          data: { rewardHours: userData.unlockRewardTime },
        });
      } else if (
        checkParentInfo.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED &&
        checkParentBankExists &&
        admin.giftCryptoSetting == 1 &&
        userExists.isGiftedCrypto == 0
      ) {
        const accountIdDetails =
          userExists.type == EUserType.PARENT && parentChildDetails
            ? await parentChildDetails.teens.find(
                (x: any) =>
                  x.childId.toString() ==
                  parentChildDetails.firstChildId.toString()
              )
            : parentChildDetails.accountId;

        /**
         * difference of 72 hours
         */
        const current = moment().unix();

        if (
          parentChildDetails &&
          parentChildDetails.unlockRewardTime &&
          current <= parentChildDetails.unlockRewardTime
        ) {
          if (
            admin.giftCryptoSetting == EGIFTSTACKCOINSSETTING.ON &&
            parentChildDetails &&
            parentChildDetails.isGiftedCrypto == EGIFTSTACKCOINSSETTING.ON &&
            parentChildDetails.unlockRewardTime
          ) {
            let crypto = await CryptoTable.findOne({ symbol: "BTC" });
            await TransactionDBService.createBtcGiftedTransaction(
              userExists._id,
              crypto,
              admin
            );

            await TradingService.internalTransfer(
              parentChildDetails,
              jwtToken,
              accountIdDetails,
              userExists.type,
              admin
            );
          }
        }
        const userData = await UserTable.findOne({ _id: userExists._id });

        return this.Ok(ctx, {
          message: "Reward Claimed Successfully",
          data: { rewardHours: userData.unlockRewardTime },
        });
      }
      return this.BadRequest(ctx, "Reward Not Claimed");
    } catch (error) {
      console.log("error: ", error);
      return this.BadRequest(ctx, "Something went wrong");
    }
  }

  /**
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/unlock-reward", method: HttpMethod.POST })
  @Auth()
  public async unlockReward(ctx: any) {
    try {
      const reqParam = ctx.request.body;
      return validationsV3.unlockRewardValidation(
        reqParam,
        ctx,
        async (validate: boolean) => {
          if (validate) {
            let updateQuery = {};
            /**
             * action 2 means no thanks and 1 means
             */
            if (reqParam.action == 2) {
              updateQuery = { ...updateQuery, unlockRewardTime: null };
            } else {
              updateQuery = { ...updateQuery, isGiftedCrypto: 1 };
            }
            await UserTable.updateOne(
              { _id: ctx.request.user._id },
              {
                $set: updateQuery,
              }
            );
            return this.Ok(ctx, { message: "Success" });
          }
        }
      );
    } catch (error) {
      return this.BadRequest(ctx, "Something went wrong");
    }
  }
}

export default new UserController();
