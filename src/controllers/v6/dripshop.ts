import BaseController from "@app/controllers/base";
import { Route } from "@app/utility";
import { Auth } from "@app/middleware";
import { HttpMethod } from "@app/types";
import { UserTable, DripshopItemTable, UserCommunityTable } from "@app/model";
import { DripshopDBService } from "@app/services/v1/index";
import { validationsV4 } from "@app/validations/v4/apiValidation";
import { CommunityDBService, UserDBService } from "@app/services/v6";
import {
  COMMUNITY_CHALLENGE_CLAIM_STATUS,
  CHALLENGE_TYPE,
  ANALYTICS_EVENTS,
  RALLY_COMMUNITY_REWARD,
} from "@app/utility/constants";
import { AnalyticsService } from "@app/services/v4";

class DripshopController extends BaseController {
  /**
   * @description THis method is used to get list of all products in drip shop
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/dripshop-items", method: HttpMethod.GET })
  @Auth()
  public async getDripshopItems(ctx: any) {
    const { user } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) return this.BadRequest(ctx, "User not found");
    const allData = await DripshopDBService.getDripshopData();

    return this.Ok(ctx, { data: allData });
  }

  /**
   * @description THis method is used to
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/dripshop-items/:itemId/redeem", method: HttpMethod.POST })
  @Auth()
  public async redeemDripshopItems(ctx: any) {
    try {
      const { user, body, params } = ctx.request;
      const [userExists, itemExists, userExistsInCommunity] = await Promise.all(
        [
          UserTable.findOne({
            _id: user._id,
          }),
          DripshopItemTable.findOne({
            _id: params.itemId,
          }),
          UserCommunityTable.findOne({ userId: user._id }),
        ]
      );
      if (!userExists) {
        return this.BadRequest(ctx, "User not found");
      }
      if (!itemExists) {
        return this.BadRequest(ctx, "Product not found");
      }
      let isClaimed = false;
      return validationsV4.dripShopValidation(
        body,
        ctx,
        async (validate: boolean) => {
          if (validate) {
            if (
              userExistsInCommunity &&
              userExistsInCommunity.isClaimed ===
                COMMUNITY_CHALLENGE_CLAIM_STATUS.PENDING &&
              itemExists.name === RALLY_COMMUNITY_REWARD
            ) {
              const totalMembers =
                await CommunityDBService.getTotalMembersInCommunity(
                  userExistsInCommunity.communityId
                );
              if (
                totalMembers.length >= 5 &&
                totalMembers[0].challengeType === CHALLENGE_TYPE[0]
              ) {
                isClaimed = true;
              }
            }
            const { createdDripshop, updatedUser } =
              await UserDBService.redeemDripShop(
                userExists,
                itemExists,
                body,
                isClaimed
              );
            /**
             * Amplitude Track Dripshop Redeemed Event
             */
            AnalyticsService.sendEvent(
              ANALYTICS_EVENTS.DRIP_SHOP_REDEEMED,
              {
                "Item Name": itemExists.name,
              },
              {
                user_id: userExists._id,
              }
            );
            await DripshopDBService.sendEmailToAdmin(
              createdDripshop,
              userExists,
              itemExists
            );
            const totalFuels =
              updatedUser.preLoadedCoins + updatedUser.quizCoins;

            return this.Ok(ctx, {
              message: "Your reward is on the way",
              data: { createdDripshop, totalFuels },
            });
          }
        }
      );
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

  /**
   * @description This method is used to get claim reward
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/claim-reward", method: HttpMethod.POST })
  @Auth()
  public async claimRewardInChallenge(ctx: any) {
    try {
      const { user } = ctx.request;
      const [userIfExists, userExistsInCommunity] = await Promise.all([
        UserTable.findOne({ _id: user._id }),
        UserCommunityTable.findOne({
          userId: user._id,
        }),
      ]);
      if (!userIfExists) return this.BadRequest(ctx, "User not found");
      if (!userExistsInCommunity)
        return this.BadRequest(
          ctx,
          "You cannot claim reward since you are not part of any community"
        );

      const updatedUser = await CommunityDBService.claimReward(
        userIfExists,
        userExistsInCommunity
      );

      return this.Ok(ctx, {
        message: "Success",
        data: {
          updatedFuel: updatedUser.preLoadedCoins + updatedUser.quizCoins,
        },
      });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }
}

export default new DripshopController();
