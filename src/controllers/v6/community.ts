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
  @Route({ path: "/join-or-create", method: HttpMethod.POST })
  @Auth()
  public async createCommunity(ctx: any) {
    const { body, user } = ctx.request;
    const [userIfExists, communityIfExists, userIfExistsInCommunity] =
      await Promise.all([
        UserTable.findOne({ _id: user._id }),
        CommunityTable.findOne({
          $or: [{ name: body.name }, { googlePlaceId: body.googlePlaceId }],
        }),
        UserCommunityTable.findOne({
          userId: user._id,
        }),
      ]);
    if (!userIfExists) return this.BadRequest(ctx, "User not found");
    if (userIfExistsInCommunity)
      return this.BadRequest(ctx, "You are already a part of one community.");

    return validationsV4.createCommunityValidation(
      body,
      ctx,
      async (validate) => {
        if (validate) {
          if (!communityIfExists && !userIfExistsInCommunity) {
            await CommunityDBService.createCommunity(body, userIfExists);
          } else {
            await CommunityDBService.joinCommunity(
              userIfExists._id,
              communityIfExists
            );
          }
          return this.Ok(ctx, {
            message: `Community ${
              communityIfExists ? "Joined" : "Created"
            } successfully.`,
          });
        }
      }
    );
  }

  /**
   * @description This method is used to get community leaderboard
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/community-leaderboard", method: HttpMethod.GET })
  @Auth()
  public async communityLeaderboard(ctx: any) {
    try {
      const { user, query } = ctx.request;
      const [userIfExists, communityIfExists] = await Promise.all([
        UserTable.findOne({ _id: user._id }),
        CommunityTable.findOne({
          _id: query.communityId,
        }).select("_id name type challenge"),
      ]);
      if (!userIfExists) return this.BadRequest(ctx, "User not found");
      if (!communityIfExists)
        return this.BadRequest(ctx, "This community does not exist");
      const {
        leaderBoardData,
        totalRecords,
        userObject,
        totalXPPoints,
        weeklyChallengeDate,
      } = await CommunityDBService.getCommunityLeaderboard(
        communityIfExists._id,
        query,
        userIfExists._id
      );

      return this.Ok(ctx, {
        message: "Success",
        data: {
          leaderBoardData,
          totalRecords,
          userObject,
          totalXPPoints,
          weeklyChallengeDate,
          communityDetails: communityIfExists,
        },
      });
    } catch (error) {
      return this.BadRequest(ctx, "Something went wrong");
    }
  }
}

export default new CommunityController();
