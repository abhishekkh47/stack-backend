import { TradingService } from "../../services/v3/index";
import moment from "moment";
import BaseController from "../base";
import {
  ENOTIFICATIONSETTINGS,
  ETransactionStatus,
  ETransactionType,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
} from "../../types";
import {
  DeviceTokenService,
  userService,
  AnalyticsService,
} from "../../services/v1/index";
import { TransactionDBService, UserService } from "../../services/v3";
import { Auth, PrimeTrustJWT } from "../../middleware";
import { validationsV4 } from "../../validations/v4/apiValidation";
import {
  UserTable,
  TransactionTable,
  UserBanksTable,
  AdminTable,
  CryptoTable,
} from "../../model";
import { Route, removeImage, uploadFileS3 } from "../../utility";
import { ANALYTICS_EVENTS } from "../../utility/constants";

class UserController extends BaseController {
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
      const userExists = await UserTable.findOne({ _id: user._id });
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

      AnalyticsService.sendEvent(ANALYTICS_EVENTS.REWARD_UNLOCKED, {
        user_id: user._id,
      });

      return this.Ok(ctx, {
        message: "Reward Unlocked Successfully",
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
      const jwtToken = ctx.request.primeTrustToken;
      const admin = await AdminTable.findOne({});
      const userExists = await UserTable.findOne({ _id: ctx.request.user._id });
      if (!userExists) {
        return this.BadRequest(ctx, "User Not Found");
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
      const userExists = await UserTable.findOne({ _id: ctx.request.user._id });
      if (!userExists) {
        return this.BadRequest(ctx, "User Not Found");
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
   * @description This method is used to add/remove device token
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/device-token", method: HttpMethod.POST })
  @Auth()
  public async addDeviceToken(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const checkUserExists = await UserTable.findOne({
      _id: user._id,
    });
    if (!checkUserExists) {
      return this.BadRequest(ctx, "User does not exist");
    }
    return validationsV4.addDeviceTokenValidation(
      ctx.request.body,
      ctx,
      async (validate) => {
        if (validate) {
          await DeviceTokenService.addDeviceTokenIfNeeded(
            checkUserExists._id,
            reqParam.deviceToken
          );
          return this.Ok(ctx, { message: "Device token added successfully" });
        }
      }
    );
  }

  /**
   * @description This method is used to update user's date of birth (DOB)
   * @param ctx
   * @returns
   */
  @Route({ path: "/update-dob", method: HttpMethod.POST })
  @Auth()
  public async updateDob(ctx: any) {
    const input = ctx.request.body;
    return validationsV4.updateDobValidation(input, ctx, async (validate) => {
      if (validate) {
        if (
          (
            await UserTable.findOne(
              { _id: ctx.request.user._id },
              { type: 1, _id: 0 }
            )
          ).type === 2 &&
          new Date(Date.now() - new Date(input.dob).getTime()).getFullYear() <
            1988
        )
          return this.BadRequest(ctx, "Parent's age should be 18+");

        await UserTable.updateOne(
          { _id: ctx.request.user._id },
          { $set: { dob: input.dob } }
        );
        return this.Ok(ctx, {
          message: "Your Date of Birth updated successfully.",
        });
      }
    });
  }

  /**
   * @description This method is used to get child of parent
   * @param ctx
   * @returns
   */
  @Route({ path: "/get-children", method: HttpMethod.POST })
  @Auth()
  public async getChildren(ctx: any) {
    const checkUserExists = await UserTable.findOne({
      _id: ctx.request.user._id,
    });
    if (!checkUserExists) {
      return this.BadRequest(ctx, "User not found");
    }
    let teens = await userService.getChildren(ctx.request.user._id);
    return this.Ok(ctx, teens);
  }

  /**
   * @description This method is used to add/remove device token
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/device-token", method: HttpMethod.DELETE })
  @Auth()
  public async removeDeviceToken(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const checkUserExists = await UserTable.findOne({
      _id: user._id,
    });
    if (!checkUserExists) {
      return this.BadRequest(ctx, "User does not exist");
    }
    return validationsV4.removeDeviceTokenValidation(
      ctx.request.body,
      ctx,
      async (validate) => {
        if (validate) {
          await DeviceTokenService.removeDeviceToken(
            checkUserExists._id,
            reqParam.deviceToken
          );
          return this.Ok(ctx, { message: "Device token removed successfully" });
        }
      }
    );
  }

  /**
   * @description This method is used for turing on/off notification
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/toggle-notification", method: HttpMethod.POST })
  @Auth()
  public async toggleNotificationSettings(ctx: any) {
    const user = ctx.request.user;
    let reqParam = ctx.request.body;
    const checkUserExists = await UserTable.findOne({
      _id: user._id,
    });
    if (!checkUserExists) {
      return this.BadRequest(ctx, "User does not exist");
    }
    return validationsV4.toggleNotificationValidation(
      ctx.request.body,
      ctx,
      async (validate) => {
        if (validate) {
          await UserTable.findByIdAndUpdate(
            { _id: checkUserExists._id },
            {
              $set: {
                isNotificationOn: reqParam.isNotificationOn,
              },
            },
            { new: true }
          );

          let message =
            reqParam.isNotificationOn == ENOTIFICATIONSETTINGS.ON
              ? "Turned on notification"
              : "Turned off notfication";

          return this.Ok(ctx, { message });
        }
      }
    );
  }

  /**
   * @description This method is used for notification visited status to true
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/set-notification-screen-status", method: HttpMethod.PATCH })
  @Auth()
  public async setNotificationVisistedStatus(ctx: any) {
    const user = ctx.request.user;
    const checkUserExists = await UserTable.findOne({
      _id: user._id,
    });
    if (!checkUserExists) {
      return this.BadRequest(ctx, "User does not exist");
    }
    await UserTable.updateOne(
      { _id: checkUserExists._id },
      { $set: { isNotificationScreenVisited: true } }
    );
    return this.Ok(ctx, { message: "Success" });
  }

  /**
   * @description This method is for update user's profile picture
   * @param ctx
   * @returns
   */
  @Route({
    path: "/update-profile-picture",
    method: HttpMethod.POST,
    middleware: [uploadFileS3.single("profile_picture")],
  })
  @Auth()
  public async updateProfilePicture(ctx: any) {
    const userExists: any = await UserTable.findOne({
      _id: ctx.request.user._id,
    });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const file = ctx.request.file;
    if (!file) {
      return this.BadRequest(ctx, "Image is not selected");
    }
    const imageName =
      file && file.key
        ? file.key.split("/").length > 0
          ? file.key.split("/")[1]
          : null
        : null;
    if (userExists.profilePicture) {
      await removeImage(userExists._id, userExists.profilePicture);
    }
    await UserTable.updateOne(
      { _id: userExists._id },
      {
        $set: { profilePicture: imageName },
      }
    );
    return this.Ok(ctx, { message: "Profile Picture updated successfully." });
  }
}

export default new UserController();
