import { getBalance } from "./../../utility/prime-trust";
import {
  ETransactionType,
  ETransactionStatus,
} from "./../../types/transaction";
import { TransactionTable } from "./../../model/transactions";
import { UserBanksTable } from "./../../model/userBanks";
import moment from "moment";
import { EGIFTSTACKCOINSSETTING, EUSERSTATUS } from "./../../types/user";
import { Auth, PrimeTrustJWT } from "../../middleware";
import { AdminTable, ParentChildTable, UserTable } from "../../model";
import {
  PortfolioService,
  TradingDBService,
  zohoCrmService,
} from "../../services/v1/index";
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
import { tradingDBService } from "../../services/v3/index";

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
            const difference =
              parentChildDetails &&
              parentChildDetails.unlockRewardTime &&
              Math.ceil(
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
                parentChildDetails.isGiftedCrypto ==
                  EGIFTSTACKCOINSSETTING.ON &&
                parentChildDetails.unlockRewardTime
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

  /**
   * @description This method is used to get portfolio for child account
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-portfolio/:childId", method: HttpMethod.GET })
  @Auth()
  @PrimeTrustJWT()
  public async getPortfolio(ctx: any) {
    console.log("----getPortfolio v3----");
    const jwtToken = ctx.request.primeTrustToken;
    const reqParam = ctx.request.params;
    return validation.getPortFolioValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const childExists: any = await UserTable.findOne({
            _id: reqParam.childId,
          });

          if (!childExists) {
            return this.BadRequest(ctx, "User Not Found");
          }

          if (childExists.type == EUserType.PARENT) {
            return this.BadRequest(ctx, "Should be SELF or TEEN");
          }

          let parentChild;
          let isTeenPending = false;
          const isTeen = childExists.type === EUserType.TEEN;

          if (isTeen) {
            parentChild = await ParentChildTable.findOne({
              "teens.childId": childExists._id,
            }).populate("userId", ["_id", "quizCoins", "status"]);
            if (parentChild && childExists.isParentFirst == true) {
              isTeenPending = true;
            }
          } else {
            parentChild = await ParentChildTable.findOne({
              userId: childExists._id,
            }).populate("userId", ["_id", "quizCoins", "status"]);
          }

          const primetrustInfo = !isTeen
            ? parentChild
            : parentChild?.teens?.find(
                (x) => x.childId.toString() == reqParam.childId
              );

          const cryptoIds =
            primetrustInfo?.accountId &&
            (await PortfolioService.getRecentPricePorfolio(
              jwtToken,
              primetrustInfo.accountId
            ));

          const userIdForBankCheck = isTeen
            ? parentChild?.userId?._id
            : childExists?._id;

          let userBankIfExists =
            userIdForBankCheck &&
            (await UserBanksTable.find({
              userId: userIdForBankCheck,
              isDefault: 1,
            }));

          const isParentKycVerified =
            parentChild?.userId?.status === EUSERSTATUS.KYC_DOCUMENT_VERIFIED;

          const userTransactionExists = await TransactionTable.findOne({
            userId: childExists._id,
            intialDeposit: true,
            type: ETransactionType.DEPOSIT,
          });

          const isKidBeforeParent =
            isTeen &&
            (!isParentKycVerified ||
              userBankIfExists.length === 0 ||
              userTransactionExists == null);

          const isSelfWithNoDeposit =
            childExists.type === EUserType.SELF &&
            userTransactionExists == null;

          const checkTransactionExistsAlready = await TransactionTable.findOne({
            userId: childExists._id,
            type: ETransactionType.BUY,
            status: ETransactionStatus.GIFTED,
          });
          let isUnlockRewardTimeExpired = false;
          if (checkTransactionExistsAlready && isTeen) {
            const current = moment().unix();
            const difference = Math.ceil(
              moment
                .duration(
                  moment
                    .unix(current)
                    .diff(moment.unix(childExists.unlockRewardTime))
                )
                .asMinutes()
            );

            if (Math.abs(difference) > 4320) {
              isUnlockRewardTimeExpired = true;
            }
          }

          const buySellTransactions =
            await tradingDBService.getPortfolioTransactions(
              childExists._id,
              isKidBeforeParent,
              cryptoIds ? cryptoIds : [],
              jwtToken,
              primetrustInfo?.accountId,
              isParentKycVerified,
              isSelfWithNoDeposit,
              userTransactionExists,
              isUnlockRewardTimeExpired
            );

          /**
           * if price didn't change any all, totalStackValue and totalSpentAmount would have been same
           * (if we don't consider cash balance)
           * Note: this totalSpentAmount includes the $5 bonus to the teens
           */

          let totalStackValue: any = 0;
          let totalSpentAmount = 0;
          let totalGainLoss: any = 0;
          let pendingInitialDepositAmount = 0;
          if (buySellTransactions.length > 0) {
            buySellTransactions.forEach((data) => {
              totalStackValue = parseFloat(
                parseFloat(totalStackValue + data.value).toFixed(2)
              );
              totalSpentAmount = parseFloat(
                parseFloat(data.totalAmount).toFixed(2)
              );
              totalGainLoss = parseFloat(
                parseFloat(totalGainLoss + data.totalGainLoss).toFixed(2)
              );
            });
          }

          const myOwnCoins = childExists.quizCoins + childExists.preLoadedCoins;
          const totalCoins = isTeen
            ? (parentChild?.userId?.quizCoins || 0) + myOwnCoins
            : myOwnCoins;

          if (isTeen && !isParentKycVerified) {
            return this.Ok(ctx, {
              data: {
                portFolio: buySellTransactions || [],
                totalStackValue,
                stackCoins: totalCoins,
                totalGainLoss,
                balance: 0,
                parentStatus: null,
                totalAmountInvested: totalSpentAmount,
                intialBalance: 0,
                isDeposit: 0,
                isTeenPending,
              },
            });
          }

          if (!primetrustInfo) {
            return this.BadRequest(ctx, "Account Details Not Found");
          }
          /**
           * Fetch Cash Balance
           */
          let cashBalance = 0;
          if (primetrustInfo.accountId) {
            const balanceInfo: any = await getBalance(
              jwtToken,
              primetrustInfo.accountId
            );
            if (balanceInfo.status == 400) {
              return this.BadRequest(ctx, balanceInfo.message);
            }
            cashBalance = balanceInfo.data.data[0].attributes.disbursable;
          }

          const pendingInitialDeposit =
            await TradingDBService.getPendingInitialDeposit(childExists._id);
          if (pendingInitialDeposit.length > 0) {
            /**
             * if initial deposit is pending, we add it to totalStackValue
             */
            pendingInitialDepositAmount = pendingInitialDeposit[0].sum;
            totalStackValue = totalStackValue + pendingInitialDeposit[0].sum;
          }
          let hasClearedDeposit = await TransactionTable.findOne({
            userId: childExists._id,
            type: ETransactionType.DEPOSIT,
            status: ETransactionStatus.SETTLED,
          });
          const isKycVerifiedAndDepositCleared =
            isParentKycVerified && hasClearedDeposit;
          totalStackValue =
            totalStackValue +
            (isKycVerifiedAndDepositCleared ? cashBalance : 0);
          return this.Ok(ctx, {
            data: {
              portFolio: buySellTransactions,
              totalStackValue,
              stackCoins: totalCoins,
              totalGainLoss,
              balance: isKycVerifiedAndDepositCleared
                ? cashBalance
                : pendingInitialDepositAmount,
              parentStatus: parentChild?.userId?.status,
              totalAmountInvested:
                totalStackValue - totalGainLoss - (isTeenPending ? 5 : 0),
              intialBalance: pendingInitialDepositAmount,
              /**
               *  0 - SKIP , 1 - PENDIGN 2 - DEPOSIT AVAILNA
               */
              isDeposit: isParentKycVerified
                ? hasClearedDeposit
                  ? 2
                  : pendingInitialDeposit.length > 0
                  ? 1
                  : 0
                : 0,
              isTeenPending,
            },
          });
        }
      }
    );
  }
}

export default new TradingController();
