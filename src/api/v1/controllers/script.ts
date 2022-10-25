import { UserTable } from "../../../model";
import { EUserType, HttpMethod } from "../../../types";
import { Route } from "../../../utility";
import BaseController from "./base";

class ScriptController extends BaseController {
  /**
   * @description This method is for updating screen status by script for migration into production
   * @param ctx
   * @returns
   */
  @Route({ path: "/update-screen-status-script", method: HttpMethod.POST })
  public async updateScreenStatusScript(ctx: any) {
    const reqParam = ctx.request.body;
    const { email } = reqParam;

    const attachEmail_Parent = (query) =>  ({
      $and: email ? [query, {type: {$not: { $eq:  EUserType.TEEN }} }, { email }] : [query, {type: EUserType.PARENT }]
    })

    const attachEmail_Teen = (query) =>  ({
      $and: email ? [query, {type: EUserType.TEEN }, { email }] : [query, {type: EUserType.PARENT }]
    })

    const updatedCountParent1 = await UserTable.updateMany(
      attachEmail_Parent({ screenStatus: 0 }),
      {
        $set: {
          screenStatus: 1,
        },
      }
    );
    const updatedCountParent2 = await UserTable.updateMany(
      attachEmail_Parent({ screenStatus: 1 }),
      {
        $set: {
          screenStatus: 5,
        },
      }
    );
    const updatedCountParent3 = await UserTable.updateMany(
      attachEmail_Parent({ screenStatus: 2 }),
      {
        $set: {
          screenStatus: 6,
        },
      }
    );
    const updatedCountParent4 = await UserTable.updateMany(
      attachEmail_Parent({ screenStatus: 3 }),
      {
        $set: {
          screenStatus: 7,
        },
      }
    );
    const updatedCountTeen1 = await UserTable.updateMany(
      attachEmail_Teen({ screenStatus: 0 }),
      {
        $set: {
          screenStatus: 10,
        },
      }
    );
    return this.Ok(ctx, {
      updatedCountParent1,
      updatedCountParent2,
      updatedCountParent3,
      updatedCountParent4,
      updatedCountTeen1,
    });
  }
}

export default new ScriptController();

/*

- 1.1.1
SIGN_UP = 0,
UPLOAD_DOCUMENTS = 1,
ADD_BANK_ACCOUNT = 2,
SUCCESS = 3,

// for teen
 SIGN_UP_TEEN = 0,
 CREATE_USERNAME = 1,
 ENTER_PHONE_NO = 2,
 ENTER_NAME = 3,
 ENTER_PARENT_INFO = 4,
 SUCCESS_TEEN = 5,
 
 - 1.2
// for parent new, self and teen
 SIGN_UP = 0,
 DOB_SCREEN = 1,
 
// for parent and self
 MYSELF_PARENT_SCREEN = 2,
 DETAIL_SCREEN = 3,
 CHILD_INFO_SCREEN = 4,
 UPLOAD_DOCUMENTS = 5,
 ADD_BANK_ACCOUNT = 6,
 SUCCESS = 7,
 
//  for teen
 ENTER_PHONE_NO = 8,
 ENTER_PARENT_INFO = 9,
 SUCCESS_TEEN = 10,
 
- mapping
 NOT teen:
 SIGN_UP = 0 -----> DOB_SCREEN = 1
 UPLOAD_DOCUMENTS = 1 -----> UPLOAD_DOCUMENTS = 5,
 ADD_BANK_ACCOUNT = 2 -----> ADD_BANK_ACCOUNT = 6,
 SUCCESS = 3 -------> SUCCESS = 7,
 
 teens:
 0 ------> SUCCESS = 10
*/