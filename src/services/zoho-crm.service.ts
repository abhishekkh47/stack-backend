import { addAccountInfoInZohoCrm } from "../utility";

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
    if (addedData.status != 200) {
      throw new Error("Error in syncing zoho crm");
    }
  }
}

export default new zohoCrmService();
