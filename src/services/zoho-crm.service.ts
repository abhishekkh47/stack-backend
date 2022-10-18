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
    console.log(`zohoCrmService Being Called`);
    let mainData = {
      data: isArray ? dataCreateOrUpdateInZoho : [dataCreateOrUpdateInZoho],
    };
    const addedData = await addAccountInfoInZohoCrm(zohoAccessToken, mainData);
    console.log(addedData, "addedData");
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
        getData.data.data.length > 0
          ? getData.data.data.filter((x) => x.Account_Type === filterValue)
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
    console.log(`zohoCrmService Being Called`);
    let mainData = {
      data: [updateRecord],
    };
    const addedData = await updateAccountInfoInZohoCrm(
      zohoAccessToken,
      id,
      mainData
    );
    console.log(addedData, "addedData");
    if (addedData.status != 200) {
      throw new Error("Error in syncing zoho crm");
    }
  }
}

export default new zohoCrmService();
