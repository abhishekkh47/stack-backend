import moment from "moment";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import {
  AdminTable,
  ParentChildTable,
  UserTable,
  UserBanksTable,
  TransactionTable,
} from "@app/model";
import {
  PortfolioService,
  TradingDBService,
  zohoCrmService,
} from "@app/services/v1/index";
import { tradingDBService } from "@app/services/v3/index";
import {
  EUserType,
  HttpMethod,
  EGIFTSTACKCOINSSETTING,
  EUSERSTATUS,
  ETransactionStatus,
  ETransactionType,
} from "@app/types";
import {
  createBank,
  createProcessorToken,
  getPublicTokenExchange,
  Route,
  getBalance,
} from "@app/utility";
import { NOTIFICATIONS, PARENT_SIGNUP_FUNNEL } from "@app/utility/constants";
import { validation } from "@app/validations/v1/apiValidation";
import BaseController from "@app/controllers/base";

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
    const { user, headers } = ctx.request;
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
          let isUnlockRewardTimeExpired = true;
          if (
            checkTransactionExistsAlready &&
            isTeen &&
            childExists.unlockRewardTime
          ) {
            const current = moment().unix();

            if (
              childExists.isRewardDeclined == false &&
              childExists.unlockRewardTime &&
              current <= childExists.unlockRewardTime
            ) {
              isUnlockRewardTimeExpired = false;
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
                showPendingMessage: !isUnlockRewardTimeExpired,
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
          totalStackValue =
            totalStackValue + (isParentKycVerified ? cashBalance : 0);
          return this.Ok(ctx, {
            data: {
              portFolio: buySellTransactions,
              totalStackValue,
              stackCoins: totalCoins,
              totalGainLoss,
              balance:
                isParentKycVerified && userBankIfExists
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
              showPendingMessage: !isUnlockRewardTimeExpired,
            },
          });
        }
      }
    );
  }
}

export default new TradingController();
