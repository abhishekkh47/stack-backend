import { addAccountInfoInZohoCrm } from "../utility";

class zohoCrmService {
  public async addAccounts(
    zohoAccessToken: string,
    dataCreateOrUpdateInZoho: object
  ) {
    console.log(`zohoCrmService Being Called`);
    let mainData = {
      data: [dataCreateOrUpdateInZoho],
    };
    const addedData = await addAccountInfoInZohoCrm(zohoAccessToken, mainData);
    if (addedData.status != 200) {
      throw new Error("Error in syncing zoho crm");
    }
  }
}

export default new zohoCrmService();
