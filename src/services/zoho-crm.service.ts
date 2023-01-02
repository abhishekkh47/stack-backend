import { quizService } from "../services";
import { EUserType, ESCREENSTATUS, EUSERSTATUS } from "./../types/user";
import { PARENT_SIGNUP_FUNNEL, TEEN_SIGNUP_FUNNEL } from "../utility/constants";
import {
  addAccountInfoInZohoCrm,
  searchAccountInfo,
  updateAccountInfoInZohoCrm,
} from "../utility";

class zohoCrmService {
  public async addAccounts(
    zohoAccessToken: string,
    dataCreateOrUpdateInZoho: any,
    isArray: boolean = null
  ) {
    let mainData = {
      data: isArray ? dataCreateOrUpdateInZoho : [dataCreateOrUpdateInZoho],
      duplicate_check_fields: ["Email"],
    };
    const addedData: any = await addAccountInfoInZohoCrm(
      zohoAccessToken,
      mainData
    );

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
          ...PARENT_SIGNUP_FUNNEL.SIGNUP,
          PARENT_SIGNUP_FUNNEL.DOB,
          PARENT_SIGNUP_FUNNEL.MOBILE_NUMBER,
          PARENT_SIGNUP_FUNNEL.CHILD_INFO,
        ],
      };
      await this.addAccounts(zohoAccessToken, newDataInCrm);
    }
  }

  /**
   * @description used to get the user data to add in zoho
   */
  public async getDataSentToCrm(allUsersInfo: any) {
    let dataSentInCrm = [];

    await allUsersInfo.map(async (user) => {
      /**
       * service to get the quiz info of specific user
       */
      let quizDataToAddInCrm = await quizService.getQuizInfoOfUser(
        user.quizData
      );

      let checkUserRegistered =
        user.type == EUserType.PARENT || user.type == EUserType.SELF
          ? user.screenStatus == ESCREENSTATUS.SUCCESS
          : user.screenStatus == ESCREENSTATUS.SUCCESS_TEEN;

      if (user.email) {
        let usertObj = {
          Account_Name: user.firstName + " " + user.lastName,
          First_Name: user.firstName,
          Last_Name: user.lastName,
          Birthday: user.dob,
          Mobile: user.mobile,
          Email: user.email,
          User_ID: user._id.toString(),
          Account_Status: String(user.status),
          Stack_Coins: user.preLoadedCoins + user.quizCoins,
          Quiz_Information: quizDataToAddInCrm,
        };
        if (user.type == EUserType.PARENT || user.type == EUserType.SELF) {
          let setParentSignupFunnel = [
            ...PARENT_SIGNUP_FUNNEL.SIGNUP,
            PARENT_SIGNUP_FUNNEL.DOB,
            PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
            PARENT_SIGNUP_FUNNEL.CHILD_INFO,
          ];

          let checkKycApproved =
            user.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED;

          let checkBankAccountAdded =
            user.screenStatus == ESCREENSTATUS.ADD_BANK_ACCOUNT;

          dataSentInCrm.push({
            ...usertObj,
            Account_Type: user.type == EUserType.PARENT ? "Parent" : "Self",
            Parent_Signup_Funnel:
              checkKycApproved && checkUserRegistered
                ? [
                    ...setParentSignupFunnel,
                    PARENT_SIGNUP_FUNNEL.UPLOAD_DOCUMENT,
                    PARENT_SIGNUP_FUNNEL.ADD_BANK,
                    PARENT_SIGNUP_FUNNEL.FUND_ACCOUNT,
                    PARENT_SIGNUP_FUNNEL.SUCCESS,
                  ]
                : (checkKycApproved && checkBankAccountAdded) ||
                  (!checkKycApproved && checkBankAccountAdded)
                ? [
                    ...setParentSignupFunnel,
                    PARENT_SIGNUP_FUNNEL.UPLOAD_DOCUMENT,
                  ]
                : [...setParentSignupFunnel],
            Parent_First: String(user.isParentFirst),
            Parent_Number: user.mobile,

            Teen_Name:
              user.type == EUserType.PARENT && user.parentChildInfo
                ? user.parentChildInfo.firstName +
                  " " +
                  user.parentChildInfo.lastName
                : null,
            Teen_Number:
              user.type == EUserType.PARENT && user.parentChildInfo
                ? user.parentChildInfo.mobile
                : null,
          });
        } else {
          let setTeenSignupFunnel = [
            TEEN_SIGNUP_FUNNEL.SIGNUP,
            TEEN_SIGNUP_FUNNEL.DOB,
            TEEN_SIGNUP_FUNNEL.PHONE_NUMBER,
          ];

          dataSentInCrm.push({
            ...usertObj,
            Account_Type: "Teen",
            Teen_Signup_Funnel: checkUserRegistered
              ? [
                  ...setTeenSignupFunnel,
                  TEEN_SIGNUP_FUNNEL.PARENT_INFO,
                  TEEN_SIGNUP_FUNNEL.SUCCESS,
                ]
              : [...setTeenSignupFunnel],

            Parent_Name:
              user.parentChildInfo &&
              user.parentChildInfo.firstName +
                " " +
                user.parentChildInfo.lastName,
            Parent_Number: user.parentMobile,
            Parent_Account:
              user.parentChildInfo &&
              user.parentChildInfo.firstName +
                " " +
                user.parentChildInfo.lastName,
          });
        }
      }
    });

    return dataSentInCrm;
  }
}

export default new zohoCrmService();
