import moment from "moment";
import { EGIFTSTACKCOINSSETTING, EUSERSTATUS } from "./../../types/user";
import { Auth, PrimeTrustJWT } from "../../middleware";
import { AdminTable, ParentChildTable, UserTable } from "../../model";
import { zohoCrmService } from "../../services/v1/index";
import { EUserType, HttpMethod } from "../../types";
import {
  createBank,
  createProcessorToken,
  getPublicTokenExchange,
  Route,
} from "../../utility";
import { PARENT_SIGNUP_FUNNEL } from "../../utility/constants";
import { validation } from "../../validations/v1/apiValidation";
import BaseController from "../base";
import { TradingService, UserService } from "../../services/v3/index";

class TradingController extends BaseController {
  /**
   * @description This method is used to add bank account in plaid(Link it)
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-bank", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async addBankDetails(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const jwtToken = ctx.request.primeTrustToken;
    const userExists = await UserTable.findOne({ _id: user._id });
    let admin = await AdminTable.findOne({});
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    // if (userExists.status !== EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
    //   return this.BadRequest(ctx, "User Kyc Information not verified");
    // }
    const query =
      userExists.type == EUserType.PARENT || userExists.type == EUserType.SELF
        ? { userId: ctx.request.user._id }
        : { "teens.childId": ctx.request.user._id };
    let parent: any = await ParentChildTable.findOne(query).populate(
      "firstChildId",
      ["email", "isGifted", "isGiftedCrypto", "firstName", "lastName"]
    );
    if (!parent) return this.BadRequest(ctx, "Invalid User");
    return validation.addBankDetailsValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          /**
           * Get public token exchange
           */
          const publicTokenExchange: any = await getPublicTokenExchange(
            reqParam.publicToken
          );
          if (publicTokenExchange.status == 400) {
            return this.BadRequest(ctx, publicTokenExchange.message);
          }
          /**
           * create processor token
           */
          const processToken: any = await createProcessorToken(
            publicTokenExchange.data.access_token,
            reqParam.accountId
          );
          if (processToken.status == 400) {
            return this.BadRequest(ctx, processToken.message);
          }
          const userBankInfo = await createBank(
            processToken.data.processor_token,
            publicTokenExchange.data.access_token,
            reqParam.institutionId,
            userExists
          );
          if (
            userExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED &&
            userBankInfo
          ) {
            const parentChildDetails = await UserService.getParentChildInfo(
              userExists._id
            );

            const accountIdDetails =
              userExists.type == EUserType.PARENT && parentChildDetails
                ? await parentChildDetails.teens.find(
                    (x: any) =>
                      x.childId.toString() ==
                      parentChildDetails.firstChildId.toString()
                  )
                : parent.accountId;

            /**
             * difference of 72 hours
             */
            const current = moment().unix();
            const difference = Math.ceil(
              moment
                .duration(
                  moment
                    .unix(current)
                    .diff(moment.unix(parentChildDetails.unlockRewardTime))
                )
                .asMinutes()
            );

            if (Math.abs(difference) <= 4320) {
              if (
                admin.giftCryptoSetting == EGIFTSTACKCOINSSETTING.ON &&
                parentChildDetails &&
                parentChildDetails.isGiftedCrypto == EGIFTSTACKCOINSSETTING.ON
              ) {
                await TradingService.internalTransfer(
                  parentChildDetails,
                  jwtToken,
                  accountIdDetails,
                  userExists.type,
                  admin
                );
              }
            }
          }

          /**
           * added bank successfully
           */
          let ParentArray = [
            ...PARENT_SIGNUP_FUNNEL.SIGNUP,
            PARENT_SIGNUP_FUNNEL.DOB,
            PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
            PARENT_SIGNUP_FUNNEL.CHILD_INFO,
            PARENT_SIGNUP_FUNNEL.UPLOAD_DOCUMENT,
            PARENT_SIGNUP_FUNNEL.ADD_BANK,
            PARENT_SIGNUP_FUNNEL.SUCCESS,
          ];
          let dataSentInCrm: any = {
            Account_Name: userExists.firstName + " " + userExists.lastName,
            Email: userExists.email,
            Parent_Signup_Funnel: ParentArray,
            Stack_Coins: admin.stackCoins,
          };
          await zohoCrmService.addAccounts(
            ctx.request.zohoAccessToken,
            dataSentInCrm
          );
          return this.Ok(ctx, { message: "Bank account linked successfully" });
        }
      }
    );
  }
}

export default new TradingController();
