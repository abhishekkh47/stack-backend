import moment from "moment";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import {
  AdminTable,
  ParentChildTable,
  QuizTopicSuggestionTable,
  UserTable,
} from "@app/model";
import { DeviceTokenService, userService } from "@app/services/v1/index";
import { UserDBService, QuizDBService } from "@app/services/v4";
import {
  ENOTIFICATIONSETTINGS,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
} from "@app/types";
import {
  removeImage,
  Route,
  uploadFileS3,
  getBalance,
  getAssetTotals,
} from "@app/utility";
import { validationsV4 } from "@app/validations/v4/apiValidation";
import BaseController from "@app/controllers/base";

class UserController extends BaseController {
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
            { new: true, upsert: true }
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

  /**
   * @description This method is for update user's profile picture
   * @param ctx
   * @returns
   */
  @Route({ path: "/set-profile-picture-leader", method: HttpMethod.POST })
  @Auth()
  public async setProfilePictureName(ctx: any) {
    const { user, body } = ctx.request;
    const userExists: any = await UserTable.findOne({
      _id: user._id,
    });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }

    return validationsV4.setProfilePictureLeaderValidation(
      body,
      ctx,
      async (validate) => {
        if (validate) {
          const updatedUser = await UserTable.findOneAndUpdate(
            { _id: userExists._id },
            {
              $set: { profilePicture: `leaders/${body.name}` },
            }
          );
          return this.Ok(ctx, {
            data: updatedUser,
            message: "Profile Picture name set successfully.",
          });
        }
      }
    );
  }

  /**
   * @description This method is used to get ranks of all 20 teens based on highest xpPoints
   * @param ctx
   * @returns {*} => list of teens based on highest ranking xp Points
   */
  @Route({
    path: "/leaderboard",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getLeaderboard(ctx: any) {
    const { user, query } = ctx.request;
    const userIfExists: any = await UserTable.findOne({
      _id: user._id,
    });
    const { leaderBoardData, userObject, totalRecords } =
      await UserDBService.getLeaderboards(userIfExists, query);
    return this.Ok(ctx, {
      data: { leaderBoardData, userObject, totalRecords },
      message: "Success",
    });
  }

  /**
   * @description This method is used to change/edit teens name
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/change-name", method: HttpMethod.PUT })
  @Auth()
  public async changeName(ctx: any) {
    try {
      const { user, body } = ctx.request;
      const userExists = await UserTable.findOne({ _id: user._id });
      if (!userExists) {
        return this.BadRequest(ctx, "User not found");
      }
      return validationsV4.changeNameValidation(body, ctx, async (validate) => {
        if (validate) {
          const updatedUser = await UserTable.findOneAndUpdate(
            { _id: userExists._id },
            {
              $set: {
                firstName: body.firstName,
                lastName: body?.lastName || userExists.lastName,
              },
            },
            { new: true, projection: { _id: 1, firstName: 1, lastName: 1 } }
          );
          return this.Ok(ctx, {
            data: updatedUser,
            message: "Your name changed successfully!",
          });
        }
      });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

  /**
   * @description This method is used to check balance greater or not
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/asset-account-balance", method: HttpMethod.GET })
  @Auth()
  @PrimeTrustJWT()
  public async checkBalance(ctx: any) {
    try {
      let hasBalance = false;
      const { user, primeTrustToken } = ctx.request;
      const userExists = await UserTable.findOne({
        _id: user._id,
        type: { $in: [EUserType.PARENT, EUserType.SELF] },
        status: EUSERSTATUS.KYC_DOCUMENT_VERIFIED,
      });
      if (!userExists) {
        return this.Ok(ctx, { data: { hasBalance } });
      }
      const parentChildRecords: any = await ParentChildTable.findOne({
        userId: userExists._id,
      });
      if (
        !parentChildRecords ||
        (userExists.type == EUserType.PARENT &&
          parentChildRecords.teens.length === 0) ||
        (userExists.type == EUserType.SELF && !parentChildRecords.accountId)
      ) {
        return this.Ok(ctx, { data: { hasBalance } });
      }
      let userInfo =
        userExists.type == EUserType.PARENT
          ? parentChildRecords.teens.filter((x) => x.accountId)
          : [parentChildRecords];
      for (let value of userInfo) {
        const balanceInfo: any = await getBalance(
          primeTrustToken,
          value.accountId
        );
        if (balanceInfo.status == 400) {
          continue;
        }
        if (balanceInfo.data.data[0].attributes.disbursable > 0) {
          hasBalance = true;
          break;
        }
        let assetInfo: any = await getAssetTotals(
          primeTrustToken,
          value.accountId
        );
        if (assetInfo.status == 400) {
          continue;
        }
        assetInfo = assetInfo?.data?.data || [];
        assetInfo =
          assetInfo.length > 0
            ? assetInfo.filter((x) => x.attributes.disbursable > 0)
            : [];
        if (assetInfo.length > 0) {
          hasBalance = true;
          break;
        }
      }
      return this.Ok(ctx, { data: { hasBalance } });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

  /**
   * @description This method is used to suggest a quiz topic to jetson team
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/quiz-topics/suggest", method: HttpMethod.POST })
  @Auth()
  public async suggestQuizTopic(ctx: any) {
    try {
      const { user, body } = ctx.request;
      const userIfExists = await UserTable.findOne({ _id: user._id });
      if (!userIfExists) {
        return this.BadRequest(ctx, "User not found");
      }
      return validationsV4.suggestTopicValidation(
        body,
        ctx,
        async (validate) => {
          if (validate) {
            const quizSuggestion =
              await QuizDBService.createQuizTopicSuggestion(
                userIfExists._id,
                body.topic
              );
            return this.Ok(ctx, {
              data: quizSuggestion,
              message: "Your suggested topic sent successfully!",
            });
          }
        }
      );
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }
}

export default new UserController();
