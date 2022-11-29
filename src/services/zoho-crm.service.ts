import { PARENT_SIGNUP_FUNNEL, TEEN_SIGNUP_FUNNEL } from "../utility/constants";
import { UserTable } from "../model";
import {
  addAccountInfoInZohoCrm,
  searchAccountInfo,
  updateAccountInfoInZohoCrm,
} from "../utility";

class zohoCrmService {
  public async addAccounts(
    zohoAccessToken: string,
    dataCreateOrUpdateInZoho: object,
    isArray: boolean = null
  ) {
    let mainData = {
      data: isArray ? dataCreateOrUpdateInZoho : [dataCreateOrUpdateInZoho],
      duplicate_check_fields: ["Email"],
    };
    const addedData = await addAccountInfoInZohoCrm(zohoAccessToken, mainData);

    if (addedData.status != 200) {
      throw new Error("Error in syncing zoho crm");
    }
  }

  public async searchAccount(
    zohoAccessToken: string,
    phone: string,
    filterValue: string
  ) {
    const getData: any = await searchAccountInfo(zohoAccessToken, phone);
    if (getData.status != 200) {
      throw new Error("Error in syncing zoho crm");
    }
    if (getData.status == 200) {
      let mainValue =
        getData?.data?.data?.length > 0
          ? getData?.data?.data?.filter((x) => x.Account_Type === filterValue)
          : [];
      return mainValue.length > 0 ? mainValue[0] : null;
    }
    return null;
  }

  public async updateAccounts(
    zohoAccessToken: string,
    id: string,
    updateRecord: object
  ) {
    let mainData = {
      data: [updateRecord],
    };
    const addedData = await updateAccountInfoInZohoCrm(
      zohoAccessToken,
      id,
      mainData
    );
    if (addedData.status != 200) {
      throw new Error("Error in syncing zoho crm");
    }
  }

  public async searchAccountsAndUpdateDataInCrm(
    zohoAccessToken: string,
    teenMobile: string,
    checkParentExists: any,
    parentFirst: any
  ) {
    /**
     * Add zoho crm
     */
    let searchAccountTeen = await this.searchAccount(
      zohoAccessToken,
      teenMobile,
      "Teen"
    );

    if (searchAccountTeen) {
      let dataSentInCrm: any = {};
      dataSentInCrm = {
        Parent_Account: {
          name: checkParentExists.lastName
            ? checkParentExists.firstName + " " + checkParentExists.lastName
            : checkParentExists.firstName,
        },
        Email: searchAccountTeen.Email,
        Teen_Signup_Funnel: [
          TEEN_SIGNUP_FUNNEL.SIGNUP,
          TEEN_SIGNUP_FUNNEL.DOB,
          TEEN_SIGNUP_FUNNEL.PHONE_NUMBER,
          TEEN_SIGNUP_FUNNEL.PARENT_INFO,
          TEEN_SIGNUP_FUNNEL.SUCCESS,
        ],
      };
      await this.updateAccounts(
        zohoAccessToken,
        searchAccountTeen.id,
        dataSentInCrm
      );
      let newDataInCrm = {
        Account_Name: checkParentExists.lastName
          ? checkParentExists.firstName + " " + checkParentExists.lastName
          : checkParentExists.firstName,
        TeenAccount: {
          id: searchAccountTeen.id,
        },
        Email: checkParentExists.email,
        Parent_First: parentFirst,
        Parent_Signup_Funnel: [
          PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
          PARENT_SIGNUP_FUNNEL.CHILD_INFO,
        ],
      };
      await this.addAccounts(zohoAccessToken, newDataInCrm);
    }
  }
}

export default new zohoCrmService();
