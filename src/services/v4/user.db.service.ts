import {
  deleteAccountInformationInZoho,
  searchAccountInfoByEmail,
  uploadFilesFetch,
} from "../../utility/index";
import fs from "fs";
import moment from "moment";
import path from "path";
import { NetworkError } from "../../middleware/error.middleware";
import { ParentChildTable, UserTable } from "../../model";
import { EUSERSTATUS, EUserType } from "../../types";
import { AuthService } from "../v1";

class UserDBService {
  /**
   * @description get latest onboarded parents
   */
  public async getLatestOnBoardedParents() {
    const parents = await UserTable.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $match: {
          type: 2,
          status: 0,
          mobile: { $ne: null },
          referralCode: { $ne: null },
          isParentOnboardingReminderSent: false,
        },
      },
    ]).exec();
    return parents;
  }

  /**
   * @description get prime trust balance
   * @param emails
   */
  public async getUserDetails(emails) {
    const users = await UserTable.aggregate([
      {
        $match: {
          type: 1,
          email: { $in: emails },
        },
      },
      {
        $lookup: {
          from: "parentchild",
          localField: "_id",
          foreignField: "teens.childId",
          as: "teenUser",
        },
      },
      {
        $unwind: {
          path: "$teenUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          accountDetails: {
            $filter: {
              input: "$teenUser.teens",
              as: "list",
              cond: {
                $eq: ["$$list.childId", "$_id"],
              },
            },
          },
        },
      },
    ]).exec();
    if (users.length == 0) {
      throw new NetworkError("Users not found", 400);
    }
    return users;
  }

  /**
   * @description search zoho data and delete it
   * @param emails
   * @param zohoAccessToken
   */
  public async searchAndDeleteZohoAccounts(emails, zohoAccessToken) {
    const zohoCrmAccounts = await Promise.all(
      await emails.map(async (data: any) => {
        let crmAccount: any = await searchAccountInfoByEmail(
          zohoAccessToken,
          data
        );
        if (
          crmAccount.status == 200 &&
          crmAccount.data &&
          crmAccount.data.data.length > 0
        ) {
          await deleteAccountInformationInZoho(
            zohoAccessToken,
            crmAccount.data.data[0].id
          );
          return data;
        }
      })
    );
    return zohoCrmAccounts;
  }

  /**
   * @description Upload Proof of address, documents in prime trust
   * @param userExists
   * @param body
   */
  public async updatePrimeTrustMedia(userExists, body, jwtToken, filesArray) {
    /**
     * Validations to be done
     */
    const parentChildExists = await ParentChildTable.findOne({
      userId: userExists._id,
    });
    if (!parentChildExists) {
      throw new NetworkError("User Not Found", 400);
    }

    let existingStatus = (
      await UserTable.findOne({ _id: userExists._id }, { status: 1, _id: 0 })
    ).status;
    if (
      existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED ||
      existingStatus === EUSERSTATUS.KYC_DOCUMENT_UPLOAD
    ) {
      throw new NetworkError(
        existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED
          ? "User already verified."
          : "User's data already uploaded.",
        400
      );
    }

    let successResponse: any = {};

    // in case of proof of address file upload
    if (filesArray.address_proof) {
      const accountIdDetails: any =
        userExists.type === EUserType.SELF
          ? parentChildExists
          : await parentChildExists.teens.find(
              (x: any) =>
                x.childId.toString() ==
                parentChildExists.firstChildId.toString()
            );
      if (!accountIdDetails) {
        throw new NetworkError("Account Details Not Found", 400);
      }
      const fullName = userExists.firstName + " " + userExists.lastName;

      let addressDocumentId = null;
      let uploadFileError = null;
      let uploadData = {
        "contact-id": parentChildExists.contactId,
        description: "Proof of Address",
        label: "Proof of Address",
        public: "true",
        file: fs.createReadStream(
          path.join(
            __dirname,
            "../../../uploads",
            filesArray.address_proof[0].filename
          )
        ),
      };
      let uploadFile: any = await uploadFilesFetch(jwtToken, uploadData);
      if (uploadFile.status == 400) uploadFileError = uploadFile.message;
      if (uploadFile.status == 200 && uploadFile.message.errors != undefined)
        uploadFileError = uploadFile.message;
      if (uploadFileError) throw new NetworkError(uploadFileError, 400);

      addressDocumentId = uploadFile.message.data.id;
      /**
       * Updating the info in parent child table
       */
      await ParentChildTable.updateOne(
        {
          userId: userExists._id,
          "teens.childId": parentChildExists.firstChildId,
        },
        {
          $set: {
            proofOfAddressId: addressDocumentId,
          },
        }
      );
      successResponse.uploadAddressProofReponse = {
        message:
          "Your documents are uploaded successfully. We are currently verifying your documents. Please wait for 24 hours.",
      };
    }

    // in case of driving license file upload
    if (filesArray.id_proof_front && filesArray.id_proof_back) {
      let files = [...filesArray.id_proof_front, ...filesArray.id_proof_back];
      /**
       * Upload both file
       */
      let frontDocumentId = null;
      let backDocumentId = null;
      let uploadFileError = null;
      for await (let fileData of files) {
        let uploadData = {
          "contact-id": parentChildExists.contactId,
          description:
            fileData.fieldname == "id_proof_front"
              ? "Front Side Driving License"
              : "Back Side Driving License",
          label:
            fileData.fieldname == "id_proof_back"
              ? "Front Side Driving License"
              : "Back Side Driving License",
          public: "true",
          file: fs.createReadStream(
            path.join(__dirname, "../../../uploads", fileData.filename)
          ),
        };
        let uploadFile: any = await uploadFilesFetch(jwtToken, uploadData);
        if (uploadFile.status == 400) {
          uploadFileError = uploadFile.message;
          break;
        }
        if (
          uploadFile.status == 200 &&
          uploadFile.message.errors != undefined
        ) {
          uploadFileError = uploadFile.message;
          break;
        }
        fileData.fieldname == "id_proof_front"
          ? (frontDocumentId = uploadFile.message.data.id)
          : (backDocumentId = uploadFile.message.data.id);
      }
      if (uploadFileError) {
        throw new NetworkError(uploadFileError, 400);
      }

      await AuthService.updateKycDocumentChecks(
        parentChildExists,
        jwtToken,
        frontDocumentId,
        backDocumentId,
        userExists
      );
    }
  }
}

export default new UserDBService();
