import { IParentChild, MongooseBaseType } from "@app/types";
import axios from "axios";

class ScriptService {
    public async sandboxApproveKYC(user: IParentChild & MongooseBaseType, ctx: any): Promise<any> {
            // Make this a function since we send this exact request twice, just with different URLs
    const sendRequest = async (url: string) => {
        return await axios
        .post(
          url,
          {
            data: {
              type: "kyc-document-checks",
              attributes: {
                "contact-id": user.contactId,
                "uploaded-document-id": "a4634951-4fa4-4f81-92a5-b97217692320",
                "backside-document-id": "c319bffc-c798-4bef-876c-9ae65b23681e",
                "kyc-document-type": "drivers_license",
                identity: true,
                "identity-photo": true,
                "proof-of-address": true,
                "kyc-document-country": "US",
              },
            }
          },
          { headers: { Authorization: `Bearer ${ctx.request.primeTrustToken}` } }
        )
        .catch((error) => {
          console.log(error);
        });
      }
  
      // First part of Staging KYC Approval
      const kycDocumentCheckResponse: any = await sendRequest("https://sandbox.primetrust.com/v2/kyc-document-checks")
      
      if (kycDocumentCheckResponse.status !== 201) return { code: kycDocumentCheckResponse.status, response: kycDocumentCheckResponse.response }
  
      const kycDocumentId = kycDocumentCheckResponse.data.data.id;
      // Second part of Staging KYC Approval
      const kycDocumentCheckVerifyResponse: any = await sendRequest(`https://sandbox.primetrust.com/v2/kyc-document-checks/${kycDocumentId}/sandbox/verify`);
      
      if (kycDocumentCheckVerifyResponse.status !== 200) return { code: kycDocumentCheckVerifyResponse.status, response: kycDocumentCheckVerifyResponse.response }

      return { status: 200, response: "Staging KYC Approval Successful" };
    }
}

export default new ScriptService();