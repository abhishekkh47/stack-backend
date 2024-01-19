import { Auth } from "@app/middleware";
import {
  BusinessProfileTable,
  UserTable,
  WeeklyJourneyResultTable,
} from "@app/model";
import { HttpMethod } from "@app/types";
import {
  Route,
  removeImage,
  uploadCompanyLogo,
  uploadHomeScreenImage,
  uploadSocialFeedback,
  uploadMvpHomeScreen,
} from "@app/utility";
import BaseController from "../base";
import { BusinessProfileService, UserService } from "@app/services/v7";
import { SYSTEM_INPUT, ANALYTICS_EVENTS } from "@app/utility";
import { AnalyticsService } from "@app/services/v4";
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
      await BusinessProfileService.addOrEditBusinessProfile(body, userIfExists);
      return this.Ok(ctx, { message: "Success" });
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

  /**
   * @description This method is get passions, aspects and related problem
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/business-idea-preference",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getBusinessIdeaPreference(ctx: any) {
    const { user, query } = ctx.request;
    const userExists: any = await UserTable.findOne({
      _id: user._id,
    });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const businessPreference =
      await BusinessProfileService.getBusinessPreference(query);
    return this.Ok(ctx, { message: "Success", data: businessPreference });
  }

  /**
   * @description This method is to generate business-idea using OpenAI GPT
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/generate-business-idea",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getBusinessIdea(ctx: any) {
    const { user, query } = ctx.request;
    const userExists: any = await UserTable.findOne({
      _id: user._id,
    });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (!query.category || !query.problem) {
      return this.BadRequest(ctx, "Provide a Category and Problem");
    }
    const prompt = `category: ${query.category}; problem: ${query.problem}.**`;
    const businessIdea = await BusinessProfileService.generateBusinessIdea(
      SYSTEM_INPUT.SYSTEM,
      prompt,
      query.passion
    );
    AnalyticsService.sendEvent(
      ANALYTICS_EVENTS.PASSION_SUBMITTED,
      {
        "Item Name": query.passion,
      },
      {
        user_id: userExists._id,
      }
    );
    AnalyticsService.sendEvent(
      ANALYTICS_EVENTS.SUB_PASSION_SUBMITTED,
      {
        "Item Name": query.category,
      },
      {
        user_id: userExists._id,
      }
    );
    AnalyticsService.sendEvent(
      ANALYTICS_EVENTS.PROBLEM_SUBMITTED,
      {
        "Item Name": query.problem,
      },
      {
        user_id: userExists._id,
      }
    );
    return this.Ok(ctx, { message: "Success", data: businessIdea });
  }

  /**
   * @description This method is to maximize user provided business-idea
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/maximize-business-idea",
    method: HttpMethod.GET,
  })
  @Auth()
  public async maximizeBusinessIdea(ctx: any) {
    const { user, query } = ctx.request;
    const userExists: any = await UserTable.findOne({
      _id: user._id,
    });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (!query.idea) {
      return this.BadRequest(ctx, "Please provide your Business Idea");
    }
    const prompt = `problem: ${query.idea}.**`;
    const businessIdea = await BusinessProfileService.generateBusinessIdea(
      SYSTEM_INPUT.USER,
      prompt,
      "maximize"
    );
    AnalyticsService.sendEvent(
      ANALYTICS_EVENTS.BUSINESS_IDEA_SUBMITTED,
      {
        "Item Name": query.idea,
      },
      {
        user_id: userExists._id,
      }
    );
    return this.Ok(ctx, { message: "Success", data: businessIdea });
  }
}

export default new BusinessProfileController();
