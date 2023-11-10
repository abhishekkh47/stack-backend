import BaseController from "@app/controllers/base";
import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { CommunityTable, UserCommunityTable } from "@app/model";
import { CommunityDBService } from "@app/services/v6";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import { validationsV4 } from "@app/validations/v4/apiValidation";

class CommunityController extends BaseController {
  /**
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/create-community", method: HttpMethod.POST })
  @Auth()
  public async createCommunity(ctx: any) {
    const { body, user } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) {
      return this.BadRequest(ctx, "User not found");
    }
    const communityIfExists = await CommunityTable.findOne({ name: body.name });
    if (communityIfExists)
      return this.BadRequest(ctx, "This community already exist");

    /**
     * communityName to be replaced by googlePlaceId
     * body.createdBy can be changed to user._id
     */
    const userIfExistsInCommunity = await UserCommunityTable.findOne({
      userId: body.createdBy,
    });
    if (userIfExistsInCommunity)
      return this.BadRequest(ctx, "User already exist in other community");

    return validationsV4.createCommunityValidation(
      body,
      ctx,
      async (validate) => {
        if (validate) {
          await CommunityDBService.createCommunity(body);
          return this.Ok(ctx, { message: "Community Created successfully." });
        }
      }
    );
  }

  /**
   * @description This method is used to add a user to existing community
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/join-community", method: HttpMethod.POST })
  @Auth()
  public async joinCommunity(ctx: any) {
    const { body, user } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) {
      return this.BadRequest(ctx, "User not found");
    }

    /**
     * body.userId can be changed to user._id
     */
    const communityIfExists = await CommunityTable.findOne({
      _id: body.communityId,
    });
    if (!communityIfExists)
      return this.BadRequest(ctx, "This community does not exist");
    const userIfExistsInCommunity = await UserCommunityTable.findOne({
      userId: body.userId,
    });
    if (userIfExistsInCommunity)
      return this.BadRequest(ctx, "User already exist in other community");

    return validationsV4.joinCommunityValidation(
      body,
      ctx,
      async (validate) => {
        if (validate) {
          await CommunityDBService.joinCommunity(body.userId, body.communityId);
          return this.Ok(ctx, { message: "Community Joined successfully." });
        }
      }
    );
  }
}

export default new CommunityController();
