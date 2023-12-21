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
  uploadBusinessInformation,
  uploadBusinessInformationData,
} from "@app/utility";
import { validationsV7 } from "@app/validations/v7/apiValidation";
import BaseController from "../base";
import { BusinessProfileService } from "@app/services/v7";
import { UserDBService } from "@app/services/v6";
import { ObjectId } from "mongodb";
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
              user._id
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
   * @description This method is for update user's profile picture
   * @param ctx
   * @returns
   */
  @Route({
    path: "/update-business-logo",
    method: HttpMethod.POST,
    middleware: [uploadBusinessInformation.single("businessLogo")],
  })
  @Auth()
  public async updateBusinessLogo(ctx: any) {
    const reqParam = ctx.request.body;
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
    if (businessProfileExists.businessLogo) {
      await removeImage(userExists._id, businessProfileExists.businessLogo);
    }
    await BusinessProfileTable.updateOne(
      { userId: userExists._id },
      {
        $set: { businessLogo: imageName },
      },
      { upsert: true }
    );
    if (reqParam?.weeklyJourneyId) {
      const dataToCreate = {
        weeklyJourneyId: reqParam.weeklyJourneyId,
        actionNum: 3,
        userId: user._id,
        actionInput: imageName,
      };
      await WeeklyJourneyResultTable.create(dataToCreate);
    }
    return this.Ok(ctx, { message: "Profile Picture updated successfully." });
  }
}

export default new BusinessProfileController();
