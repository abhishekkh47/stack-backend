import userDbService from "../../services/v4/user.db.service";
import { validation } from "../../validations/v1/apiValidation";
import { Auth, PrimeTrustJWT } from "../../middleware";
import { UserTable } from "../../model";
import { AuthService } from "../../services/v1/index";
import { EUserType, HttpMethod } from "../../types";
import { Route, uploadIdProof } from "../../utility";
import BaseController from "../base";

class WebHookController extends BaseController {
  /**
   * @description This method is update the error related information in prime trust as well as our database
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/update-primetrust-information",
    method: HttpMethod.PUT,
    middleware: [
      uploadIdProof.fields([
        { name: "id_proof_back", maxCount: 1 },
        { name: "id_proof_front", maxCount: 1 },
        { name: "address_proof", maxCount: 1 },
      ]),
    ],
  })
  @Auth()
  @PrimeTrustJWT()
  public async changeDataIntoPrimeTrust(ctx: any) {
    const { body } = ctx.request;
    console.log(ctx.request.files);
    console.log(body, "body");
    body["primary-address"] = body["primary-address"]
      ? JSON.parse(body["primary-address"])
      : {};
    return validation.changePrimeTrustValidation(
      body,
      ctx,
      async (validate) => {
        if (validate) {
          const jwtToken = ctx.request.primeTrustToken;
          const user = ctx.request.user;
          const userExists: any = await UserTable.findOne({
            _id: user._id,
          }).populate("stateId", ["name", "shortName"]);
          if (!userExists || userExists.type == EUserType.TEEN) {
            return this.BadRequest(ctx, "User Not Found");
          }

          await userDbService.updatePrimeTrustMedia(
            userExists,
            body,
            ctx.request.primeTrustToken,
            ctx.request.files
          );

          await AuthService.updatePrimeTrustData(
            body,
            userExists,
            ctx.request.primeTrustToken
          );

          return this.Ok(ctx, { message: "Info updated successfully." });
        }
      }
    );
  }
}

export default new WebHookController();
