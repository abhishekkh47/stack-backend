import { Auth } from "@app/middleware";
import {
  BusinessProfileTable,
  UserTable,
  QuizTable,
  WeeklyJourneyResultTable,
} from "@app/model";
import { HttpMethod } from "@app/types";
import {
  Route,
  uploadFileS3,
  removeImage,
  uploadCompanyLogo,
  uploadHomeScreenImage,
  uploadSocialFeedback,
  uploadMvpHomeScreen,
} from "@app/utility";
import { validationsV7 } from "@app/validations/v7/apiValidation";
import BaseController from "../base";
import { BusinessProfileService } from "@app/services/v7";
import { UserService } from "@app/services/v7";
class BusinessProfileController extends BaseController {
  /**
   * @description This method is add/edit business profile information
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/business-journey-information",
    method: HttpMethod.POST,
  })
  @Auth()
  public async storeBusinessProfile(ctx: any) {
    try {
      const { body, user } = ctx.request;
      const userIfExists = await UserTable.findOne({ _id: user._id });
      if (!userIfExists) return this.BadRequest(ctx, "User not found");
      return validationsV7.businessJourneyProfileValidation(
        body,
        ctx,
        async (validate: boolean) => {
          if (validate) {
            await BusinessProfileService.addOrEditBusinessProfile(
              body,
              userIfExists
            );
            return this.Ok(ctx, { message: "Success" });
          }
        }
      );
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

  /**
   * @description This method is get business profile information
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/business-profile/:id",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getBusinessProfile(ctx: any) {
    try {
      const { id } = ctx.request.params;
      if (!/^[0-9a-fA-F]{24}$/.test(id))
        return this.BadRequest(ctx, "Business Profile not found.");
      const userIfExists = await UserTable.findOne({ _id: id });
      if (!userIfExists) {
        return this.BadRequest(ctx, "User not found.");
      }
      const businessProfile = await BusinessProfileService.getBusinessProfile(
        id
      );
      return this.Ok(ctx, { data: businessProfile });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

  /**
   * @description This method is for update user's company logo
   * @param ctx
   * @returns
   */
  @Route({
    path: "/update-company-logo",
    method: HttpMethod.POST,
    middleware: [uploadCompanyLogo.single("companyLogo")],
  })
  @Auth()
  public async updateCompanyLogo(ctx: any) {
    const { user } = ctx.request;
    const userExists: any = await UserTable.findOne({
      _id: user._id,
    });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const businessProfileExists = await BusinessProfileTable.findOne({
      userId: user._id,
    });
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
    if (businessProfileExists.companyLogo) {
      await removeImage(userExists._id, businessProfileExists.companyLogo);
    }
    await BusinessProfileTable.updateOne(
      { userId: userExists._id },
      {
        $set: { companyLogo: imageName },
      },
      { upsert: true }
    );
    if (ctx?.request?.body?.weeklyJourneyId) {
      const dataToCreate = {
        weeklyJourneyId: ctx.request.body.weeklyJourneyId,
        actionNum: ctx.request.body.actionNum,
        userId: user._id,
        actionInput: imageName,
      };
      await WeeklyJourneyResultTable.create(dataToCreate);
      UserService.updateUserScore(userExists, ctx.request.body);
    }
    return this.Ok(ctx, { message: "Profile Picture updated successfully." });
  }

  /**
   * @description This method is for update user's homescreen Image
   * @param ctx
   * @returns
   */
  @Route({
    path: "/update-homescreen-image",
    method: HttpMethod.POST,
    middleware: [uploadHomeScreenImage.single("homescreenImage")],
  })
  @Auth()
  public async updateHomescreenImage(ctx: any) {
    const { user } = ctx.request;
    const userExists: any = await UserTable.findOne({
      _id: user._id,
    });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const businessProfileExists = await BusinessProfileTable.findOne({
      userId: user._id,
    });
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
    if (businessProfileExists.homescreenImage) {
      await removeImage(userExists._id, businessProfileExists.homescreenImage);
    }
    await BusinessProfileTable.updateOne(
      { userId: userExists._id },
      {
        $set: { homescreenImage: imageName },
      },
      { upsert: true }
    );
    if (ctx?.request?.body?.weeklyJourneyId) {
      const dataToCreate = {
        weeklyJourneyId: ctx.request.body.weeklyJourneyId,
        actionNum: ctx.request.body.actionNum,
        userId: user._id,
        actionInput: imageName,
      };
      await WeeklyJourneyResultTable.create(dataToCreate);
      UserService.updateUserScore(userExists, ctx.request.body);
    }
    return this.Ok(ctx, { message: "Profile Picture updated successfully." });
  }

  /**
   * @description This method is for upload social feedback image
   * @param ctx
   * @returns
   */
  @Route({
    path: "/update-social-feedback",
    method: HttpMethod.POST,
    middleware: [uploadSocialFeedback.single("socialFeedback")],
  })
  @Auth()
  public async updateSocialFeedbackImage(ctx: any) {
    const { user } = ctx.request;
    const userExists: any = await UserTable.findOne({
      _id: user._id,
    });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const businessProfileExists = await BusinessProfileTable.findOne({
      userId: user._id,
    });
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
    if (businessProfileExists.socialFeedback) {
      await removeImage(userExists._id, businessProfileExists.socialFeedback);
    }
    await BusinessProfileTable.updateOne(
      { userId: userExists._id },
      {
        $set: { socialFeedback: imageName },
      },
      { upsert: true }
    );
    if (ctx?.request?.body?.weeklyJourneyId) {
      const dataToCreate = {
        weeklyJourneyId: ctx.request.body.weeklyJourneyId,
        actionNum: ctx.request.body.actionNum,
        userId: user._id,
        actionInput: imageName,
      };
      await WeeklyJourneyResultTable.create(dataToCreate);
      UserService.updateUserScore(userExists, ctx.request.body);
    }
    return this.Ok(ctx, { message: "Profile Picture updated successfully." });
  }

  /**
   * @description This method is for update user's MVP homescreen Image
   * @param ctx
   * @returns
   */
  @Route({
    path: "/update-mvp-homescreen",
    method: HttpMethod.POST,
    middleware: [uploadMvpHomeScreen.single("mvpHomeScreen")],
  })
  @Auth()
  public async updateMVPHomeScreenImage(ctx: any) {
    const { user } = ctx.request;
    const userExists: any = await UserTable.findOne({
      _id: user._id,
    });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const businessProfileExists = await BusinessProfileTable.findOne({
      userId: user._id,
    });
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
    if (businessProfileExists.mvpHomeScreen) {
      await removeImage(userExists._id, businessProfileExists.mvpHomeScreen);
    }
    await BusinessProfileTable.updateOne(
      { userId: userExists._id },
      {
        $set: { mvpHomeScreen: imageName },
      },
      { upsert: true }
    );
    if (ctx?.request?.body?.weeklyJourneyId) {
      const dataToCreate = {
        weeklyJourneyId: ctx.request.body.weeklyJourneyId,
        actionNum: ctx.request.body.actionNum,
        userId: user._id,
        actionInput: imageName,
      };
      await WeeklyJourneyResultTable.create(dataToCreate);
      UserService.updateUserScore(userExists, ctx.request.body);
    }
    return this.Ok(ctx, { message: "Profile Picture updated successfully." });
  }
}

export default new BusinessProfileController();
