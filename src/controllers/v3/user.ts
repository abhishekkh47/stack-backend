import { TradingService } from "../../services/v3/index";
import { EGIFTSTACKCOINSSETTING } from "./../../types/user";
import moment from "moment";
import BaseController from "../base";
import {
  ETransactionStatus,
  ETransactionType,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
} from "../../types";
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
import userService from "@app/services/v3/user.service";

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
   * @description This method is start reward time , make intial transaction and set isGiftedCrypto to 1
   * @param ctx
   */
  @Route({ path: "/start-reward-timer", method: HttpMethod.POST })
  @Auth()
  public async startRewardTimer(ctx: any) {
    try {
      const user = ctx.request.user;
      const admin = await AdminTable.findOne({});
      let userExists = await UserTable.findOne({ _id: user._id });
      if (!userExists) {
        userExists = await UserTable.findOne({ _id: ctx.request.body.userId });
      }
      if (!userExists || (userExists && userExists.type !== EUserType.TEEN)) {
        return this.BadRequest(ctx, "User Not Found");
      }
      if (userExists.unlockRewardTime) {
        return this.BadRequest(ctx, "You already unlocked the reward");
      }
      let transactionExists = await TransactionTable.findOne({
        userId: userExists._id,
        type: ETransactionType.BUY,
        status: ETransactionStatus.GIFTED,
      });
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
      } else if (transactionExists) {
        await UserTable.findOneAndUpdate(
          { _id: userExists._id },
          {
            $set: {
              unlockRewardTime: moment().add(admin.rewardHours, "hours").unix(),
              isGiftedCrypto: 1,
            },
          }
        );
      }
      const userData = await UserTable.findOne({ _id: userExists._id });
      return this.Ok(ctx, {
        message: "Reward Claimed Successfully",
        data: { rewardHours: userData.unlockRewardTime },
      });
    } catch (error) {
      return this.BadRequest(ctx, "Something went wrong");
    }
  }

  /**
   * @description This method is used to reward crypto when parent is completed with kyc + bank details
   * @param ctx
   */
  @Route({ path: "/reward-crypto", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async rewardCrypto(ctx: any) {
    try {
      const reqParam = ctx.request.body;
      const jwtToken = ctx.request.primeTrustToken;
      const admin = await AdminTable.findOne({});
      let userExists = await UserTable.findOne({ _id: ctx.request.user._id });
      if (!userExists) {
        userExists = await UserTable.findOne({ _id: reqParam.userId });
        if (!userExists) {
          return this.BadRequest(ctx, "User Not Found");
        }
      }
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
        checkParentInfo &&
        checkParentInfo.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED &&
        checkParentBankExists &&
        admin.giftCryptoSetting == 1 &&
        userExists.isGiftedCrypto !== 2
      ) {
        const accountIdDetails = await parentChildDetails.teens.find(
          (x: any) => x.childId.toString() == userExists._id.toString()
        ).accountId;

        if (parentChildDetails && userExists.isRewardDeclined == false) {
          await TradingService.internalTransfer(
            parentChildDetails,
            jwtToken,
            accountIdDetails,
            userExists.type,
            admin,
            true
          );
        }
      }
      return this.Ok(ctx, { message: "Success" });
    } catch (error) {
      return this.BadRequest(ctx, "Something went wrong");
    }
  }

  /**
   * @description This method is used to decline the reward
   * @param ctx
   */
  @Route({ path: "/decline-reward", method: HttpMethod.POST })
  @Auth()
  public async declineReward(ctx: any) {
    try {
      const reqParam = ctx.request.body;
      let userExists = await UserTable.findOne({ _id: ctx.request.user._id });
      if (!userExists) {
        userExists = await UserTable.findOne({ _id: reqParam.userId });
        if (!userExists) {
          return this.BadRequest(ctx, "User Not Found");
        }
      }
      await UserTable.findOneAndUpdate(
        { userId: userExists._id },
        {
          $set: {
            isRewardDeclined: true,
          },
        }
      );
      await TransactionTable.deleteOne({
        userId: userExists._id,
        status: ETransactionStatus.GIFTED,
      });
      return this.Ok(ctx, { message: "Reward Declined Successfully" });
    } catch (error) {
      return this.BadRequest(ctx, "Something went wrong");
    }
  }

  /**
   * @description This method is used to delete the user information
   * @param ctx
   */
  @Route({ path: "/delete-user", method: HttpMethod.DELETE })
  @Auth()
  public async deleteUserDetails(ctx: any) {
    try {
      let user = ctx.request.user;
      let userExists = await UserTable.findOne({ _id: user._id });
      if (!userExists) {
        return this.BadRequest(ctx, "User not found");
      }
      const isDetailsDeleted = await userService.deleteUserData(userExists);
      if (!isDetailsDeleted) {
        return this.BadRequest(ctx, "Error in deleting account");
      }
      return this.Ok(ctx, { message: "User Deleted Successfully" });
    } catch (error) {
      return this.BadRequest(ctx, "Something Went Wrong");
    }
  }
}

export default new UserController();
