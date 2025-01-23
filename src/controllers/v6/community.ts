import BaseController from "@app/controllers/base";
import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { CommunityTable, UserCommunityTable } from "@app/model";
import { CommunityDBService } from "@app/services/v6";
import { HttpMethod } from "@app/types";
import { Route, searchSchools } from "@app/utility";
import {
  CHALLENGE_TYPE,
  DEPRECATED_COMMUNITIES,
  RALLY_COMMUNITY_CHALLENGE_GOAL,
} from "@app/utility/constants";
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
        CommunityTable.findOne({ googlePlaceId: body.googlePlaceId }),
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
      let [userIfExists, communityIfExists]: any = await Promise.all([
        UserTable.findOne({ _id: user._id }),
        CommunityTable.findOne({
          _id: query.communityId,
        }).select("_id name challenge isNextChallengeScheduled"),
      ]);
      if (!userIfExists) return this.BadRequest(ctx, "User not found");
      if (!communityIfExists)
        return this.BadRequest(ctx, "This community does not exist");
      communityIfExists =
        await CommunityDBService.updateCommunityToLatestChallenge(
          communityIfExists
        );
      const {
        leaderBoardData,
        totalRecords,
        userObject,
        totalXPPoints,
        weeklyChallengeDate,
      } = await CommunityDBService.getCommunityLeaderboard(
        communityIfExists,
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

  /**
   * @description This method is used to search community based on text
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/search-community", method: HttpMethod.GET })
  @Auth()
  public async searchCommunity(ctx: any) {
    try {
      const { user, query } = ctx.request;
      if (!query.input)
        return this.BadRequest(ctx, "Please enter text to search...");

      const [userIfExists, userExistsInCommunity] = await Promise.all([
        UserTable.findOne({ _id: user._id }),
        UserCommunityTable.findOne({ userId: user._id }),
      ]);
      if (!userIfExists) return this.BadRequest(ctx, "User not found");
      if (userExistsInCommunity)
        return this.BadRequest(ctx, "User already exists in community");

      let [placeApiResponse, entrepreneurCommunities]: any = await Promise.all([
        searchSchools(query.input),
        CommunityTable.find({
          name: { $regex: query.input, $options: "i" },
          type: 1,
        }),
      ]);
      const uniqueNames = new Set();
      const uniqueNamesWithCityPrefix = [];
      const filteredData = [];
      placeApiResponse.data.predictions.forEach((item) => {
        const schoolName = `${item.terms[0]?.value} (${
          item.terms[item.terms.length - 2]?.value
        })`.toLowerCase();
        let ifExists = -1;
        const schoolNameWithCity = `${
          item.terms[item.terms.length - 3]?.value
        } ${item.terms[0].value}`?.toLowerCase();
        uniqueNamesWithCityPrefix?.some((school) => {
          ifExists = schoolNameWithCity?.indexOf(school);
          return ifExists >= 0;
        });
        if (
          !uniqueNames.has(schoolName) &&
          !DEPRECATED_COMMUNITIES.includes(item?.terms[0]?.value) &&
          (ifExists == -1 || !uniqueNamesWithCityPrefix.length)
        ) {
          uniqueNamesWithCityPrefix.push(schoolNameWithCity);
          uniqueNames.add(schoolName);
          filteredData.push(item);
        }
      });
      let result = [];
      if (filteredData.length > 0) {
        result = await Promise.all(
          filteredData.map(async (item) => {
            const communityExists = await CommunityTable.findOne({
              googlePlaceId: item.place_id,
              name: item?.structured_formatting?.main_text,
            });
            return {
              isCommunityExists: communityExists ? true : false,
              name: item.structured_formatting.main_text,
              placeId: communityExists
                ? communityExists.googlePlaceId
                : item.place_id,
              address: item.structured_formatting.secondary_text,
              state: item.terms[item.terms.length - 2].value,
            };
          })
        );
      }
      entrepreneurCommunities?.forEach((obj) => {
        result.push({
          isCommunityExists: true,
          name: obj.name,
          placeId: obj.googlePlaceId,
          address: `${obj.googlePlaceId}, USA`,
          state: obj.googlePlaceId.split(",")[1],
        });
      });
      return this.Ok(ctx, { data: result });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }
}

export default new CommunityController();
