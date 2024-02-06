import { Auth, PrimeTrustJWT } from "@app/middleware";
import {
  BusinessProfileTable,
  UserTable,
  WeeklyJourneyResultTable,
  ActionScreenCopyTable,
} from "@app/model";
import { HttpMethod } from "@app/types";
import {
  Route,
  removeImage,
  uploadCompanyLogo,
  uploadHomeScreenImage,
  uploadSocialFeedback,
  uploadMvpHomeScreen,
  SYSTEM_INPUT,
  ANALYTICS_EVENTS,
} from "@app/utility";
import BaseController from "../base";
import { BusinessProfileService, UserService } from "@app/services/v7";
import { AnalyticsService } from "@app/services/v4";
import { zohoCrmService } from "@app/services/v1";
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
  @PrimeTrustJWT(true)
  public async storeBusinessProfile(ctx: any) {
    try {
      const { body, user } = ctx.request;
      const [userIfExists, actionScreenData] = await Promise.all([
        UserTable.findOne({ _id: user._id }),
        ActionScreenCopyTable.find(),
      ]);
      if (!userIfExists) return this.BadRequest(ctx, "User not found");
      const updatedUser = await BusinessProfileService.addOrEditBusinessProfile(
        body,
        userIfExists,
        actionScreenData
      );
      (async () => {
        zohoCrmService.addAccounts(
          ctx.request.zohoAccessToken,
          updatedUser,
          true
        );
      })();
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
    const [userExists, businessProfileExists, actionScreenData]: any =
      await Promise.all([
        UserTable.findOne({
          _id: user._id,
        }),
        BusinessProfileTable.findOne({
          userId: user._id,
        }),
        ActionScreenCopyTable.find(),
      ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const file = ctx.request.file;
    if (!file) {
      return this.BadRequest(ctx, "Image is not selected");
    }
    const imageName = file.key?.split("/")?.[1] || null;

    if (businessProfileExists.companyLogo) {
      await removeImage(userExists._id, businessProfileExists.companyLogo);
    }
    const getHoursSaved = actionScreenData.filter(
      (action) => action?.key == "companyLogo"
    );
    const businessProfileObj = {
      companyLogo: imageName,
      isRetry: false,
      aiGeneratedSuggestions: null,
    };
    if (getHoursSaved.length) {
      businessProfileObj["hoursSaved"] =
        businessProfileExists.hoursSaved > getHoursSaved[0].hoursSaved
          ? businessProfileExists.hoursSaved
          : getHoursSaved[0].hoursSaved;
    }
    await Promise.all([
      BusinessProfileTable.updateOne(
        { userId: userExists._id },
        { $set: businessProfileObj },
        { upsert: true }
      ),
      ctx?.request?.body?.weeklyJourneyId
        ? WeeklyJourneyResultTable.create({
            weeklyJourneyId: ctx.request.body.weeklyJourneyId,
            actionNum: ctx.request.body.actionNum,
            userId: user._id,
            actionInput: imageName,
          }).then(() =>
            UserService.updateUserScore(userExists, ctx.request.body)
          )
        : Promise.resolve(),
    ]);
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
        $set: { homescreenImage: imageName, isRetry: false },
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
        $set: { socialFeedback: imageName, isRetry: false },
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
        $set: { mvpHomeScreen: imageName, isRetry: false },
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
    if (!query.category || !query.problem || !query.passion) {
      return this.BadRequest(ctx, "Provide a Category and Problem");
    }
    const prompt = `category: ${query.category}; problem: ${query.problem}.**`;
    const businessIdea = await BusinessProfileService.generateBusinessIdea(
      SYSTEM_INPUT.SYSTEM,
      prompt,
      query.passion,
      userExists,
      query.isRetry
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
      "maximize",
      userExists,
      query.isRetry
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

  /**
   * @description This method is to generate suggestions from OpenAI-API based on based on user input
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/get-ai-suggestions",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getAISuggestion(ctx: any) {
    const { user, query } = ctx.request;
    const [userExists, userBusinessProfile] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }),
    ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (!query.key) {
      return this.BadRequest(ctx, "Please provide a valid requirement");
    }
    let response = await BusinessProfileService.generateAISuggestions(
      userExists,
      query.key,
      userBusinessProfile,
      query.actionInput,
      query.isRetry
    );
    return this.Ok(ctx, { message: "Success", data: response });
  }

  /**
   * @description This method is meant to be polled to determine if logo images have been successfully generated and uploaded
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/check-logo-generation-complete",
    method: HttpMethod.GET,
  })
  @Auth()
  public async checkLogoGenerationComplete(ctx: any) {
    const { user } = ctx.request;
    const userBusinessProfile = await BusinessProfileTable.findOne({ userId: user._id });
    if (!userBusinessProfile) {
      return this.BadRequest(ctx, "Business Profile Not Found");
    }
    const finished = userBusinessProfile.aiGeneratedSuggestions.length === 4;
    return this.Ok(ctx, { message: "Success", data: { finished } });
  }
}

export default new BusinessProfileController();
