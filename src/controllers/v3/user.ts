import BaseController from "../base";
import { EUSERSTATUS, EUserType, HttpMethod } from "../../types";
import { UserService } from "../../services/v2";
import { Auth, PrimeTrustJWT } from "../../middleware";
import {
  ParentChildTable,
  UserTable,
  TransactionTable,
  UserBanksTable,
} from "../../model";
import { CMS_LINKS } from "../../utility/constants";
import { Route } from "../../utility";

class UserController extends BaseController {
  /**
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/get-profile/:id", method: HttpMethod.GET })
  @Auth()
  public async getProfile(ctx: any) {
    const { id } = ctx.request.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id))
      return this.BadRequest(ctx, "Enter valid ID.");
    let { data } = await UserService.getProfile(id);

    const checkIntitalDepositDone = await TransactionTable.findOne({
      $or: [{ parentId: id }, { userId: id }],
      intialDeposit: true,
    });

    if (data) {
      if (checkIntitalDepositDone) {
        data.initialDeposit = 1;
      }
      const checkParentExists = await UserTable.findOne({
        mobile: data.parentMobile ? data.parentMobile : data.mobile,
      });
      const checkBankExists =
        checkParentExists?._id &&
        (await UserBanksTable.find({
          userId: checkParentExists._id,
        }));
      if (
        !checkParentExists ||
        (checkParentExists &&
          checkParentExists.status !== EUSERSTATUS.KYC_DOCUMENT_VERIFIED)
      ) {
        data.isParentApproved = 0;
      } else {
        data.isParentApproved = 1;
      }
      if (
        !checkParentExists ||
        (checkParentExists && checkBankExists.length == 0)
      ) {
        data.isRecurring = 0;
      } else if (checkBankExists.length > 0) {
        if (data.isRecurring == 1 || data.isRecurring == 0) {
          data.isRecurring = 1;
        }
      }
    }

    data = {
      ...data,
      terms: CMS_LINKS.TERMS,
      amcPolicy: CMS_LINKS.AMC_POLICY,
      privacy: CMS_LINKS.PRIVACY_POLICY,
      ptUserAgreement: CMS_LINKS.PRIME_TRUST_USER_AGREEMENT,
    };

    return this.Ok(ctx, data, true);
  }
}

export default new UserController();
