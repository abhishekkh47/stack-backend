import envData from "@app/config/index";
import BaseController from "@app/controllers/base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import { ParentChildTable, UserTable } from "@app/model";
import { zohoCrmService } from "@app/services/v1";
import userService from "@app/services/v3/user.service";
import userServiceV7 from "@app/services/v7/user.service";
import { AnalyticsService } from "@app/services/v4";
import { EUSERSTATUS, EUserType, HttpMethod } from "@app/types";
import {
  ANALYTICS_EVENTS,
  createAccount,
  kycDocumentChecks,
  PARENT_SIGNUP_FUNNEL,
  removeImage,
  Route,
  uploadFileS3,
  uploadFilesFetch,
  uploadIdProof,
} from "@app/utility";
import fs from "fs";
import path from "path";

class UserController extends BaseController {
  /**
   * @description This method is used to delete the user information
   * @param ctx
   */
  @Route({ path: "/delete-user", method: HttpMethod.DELETE })
  @Auth()
  @PrimeTrustJWT(true)
  public async deleteUserDetails(ctx: any) {
    try {
      let user = ctx.request.user;
      const { zohoAccessToken, primeTrustToken } = ctx.request;
      let userExists = await UserTable.findOne({ _id: user._id });
      if (!userExists) {
        return this.BadRequest(ctx, "User not found");
      }
      const isDetailsDeleted = await userServiceV7.deleteUserData(
        userExists,
        zohoAccessToken,
        primeTrustToken
      );
      if (!isDetailsDeleted) {
        return this.BadRequest(ctx, "Error in deleting account");
      }
      return this.Ok(ctx, { message: "User Deleted Successfully" });
    } catch (error) {
      return this.BadRequest(ctx, "Something Went Wrong");
    }
  }

  /**
   * @description This method is used to upload files
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/upload-id-proof",
    method: HttpMethod.POST,
    middleware: [
      uploadIdProof.fields([
        {
          name: "id_proof_front",
          maxCount: 1,
        },
        { name: "id_proof_back", maxCount: 1 },
      ]),
    ],
  })
  @Auth()
  @PrimeTrustJWT(true)
  public async uploadFilesData(ctx: any) {
    const files = ctx.request.files;
    if (!files) {
      return this.BadRequest(ctx, "File not found");
    }
    const jwtToken = ctx.request.primeTrustToken;
    const userExists: any = await UserTable.findOne({
      _id: ctx.request.user._id,
    }).populate("stateId", ["name", "shortName"]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const parentChildExists = await ParentChildTable.findOne({
      userId: userExists._id,
    });
    if (parentChildExists && parentChildExists.frontDocumentId) {
      return this.Ok(ctx, {
        message: "You have already uploaded driving license",
      });
    }
    let firstChildExists = await UserTable.findOne({
      _id: parentChildExists.firstChildId,
    });
    if (!firstChildExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    let newArrayFiles = [];
    if (!files.id_proof_front || !files.id_proof_back) {
      return this.BadRequest(
        ctx,
        "You need to upload front and back side of driver's license"
      );
    }
    newArrayFiles = [...files.id_proof_front, ...files.id_proof_back];
    const fullName = userExists.lastName
      ? userExists.firstName + " " + userExists.lastName
      : userExists.firstName;
    const childName = firstChildExists.lastName
      ? firstChildExists.firstName + " " + firstChildExists.lastName
      : firstChildExists.firstName;
    const data = {
      type: "account",
      attributes: {
        "account-type": "custodial",
        name:
          userExists.type == EUserType.SELF
            ? fullName
            : childName + " - " + fullName,
        "authorized-signature": fullName,
        "webhook-config": {
          url: envData.WEBHOOK_URL,
          enabled: true,
        },
        owner: {
          "contact-type": "natural_person",
          name: fullName,
          email: userExists.email,
          "date-of-birth": userExists.dob,
          "tax-id-number": userExists.taxIdNo,
          "tax-country": userExists.country,
          "ip-address": "127.0.0.2",
          geolocation: "",
          "primary-phone-number": {
            country: "CA",
            number: userExists.mobile,
            sms: false,
          },
          "primary-address": {
            "street-1": userExists.address,
            "street-2": userExists.unitApt ? userExists.unitApt : "",
            "postal-code": userExists.postalCode,
            city: userExists.city,
            region: userExists.state,
            country: userExists.country,
          },
        },
      },
    };
    const createAccountData: any = await createAccount(jwtToken, data);
    if (createAccountData.status == 400) {
      return this.BadRequest(ctx, createAccountData.message);
    }

    /**
     * Upload both file
     */
    let frontDocumentId = null;
    let backDocumentId = null;
    let uploadFileError = null;
    for await (let fileData of newArrayFiles) {
      let uploadData = {
        "contact-id": createAccountData.data.included[0].id,
        description:
          fileData.fieldname == "id_proof_front"
            ? "Front Side Driving License"
            : "Back Side Driving License",
        label:
          fileData.fieldname == "id_proof_back"
            ? "Back Side Driving License"
            : "Front Side Driving License",
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
      if (uploadFile.status == 200 && uploadFile.message.errors != undefined) {
        uploadFileError = uploadFile.message;
        break;
      }
      fileData.fieldname == "id_proof_front"
        ? (frontDocumentId = uploadFile.message.data.id)
        : (backDocumentId = uploadFile.message.data.id);
      /**
       * Delete image from our server
       */
      try {
        fs.unlinkSync(
          path.join(__dirname, "../../../uploads", fileData.filename)
        );
      } catch (err) {
        console.log("Error in removing image");
      }
    }
    if (uploadFileError) {
      return this.BadRequest(ctx, uploadFileError);
    }
    /**
     * Checking the kyc document checks
     */
    const kycData = {
      type: "kyc-document-checks",
      attributes: {
        "contact-id": createAccountData.data.included[0].id,
        "uploaded-document-id": frontDocumentId,
        "backside-document-id": backDocumentId,
        "kyc-document-type": "drivers_license",
        identity: true,
        "identity-photo": true,
        "proof-of-address": true,
        "kyc-document-country": "US",
      },
    };
    let kycResponse: any = await kycDocumentChecks(jwtToken, kycData);
    if (kycResponse.status == 400) {
      return this.BadRequest(ctx, kycResponse.message);
    }
    if (kycResponse.status == 200 && kycResponse.data.errors != undefined) {
      return this.BadRequest(ctx, kycResponse);
    }
    await UserTable.updateOne(
      {
        _id: userExists._id,
      },
      {
        $set: {
          status: EUSERSTATUS.KYC_DOCUMENT_UPLOAD,
        },
      }
    );
    /**
     * Updating the info in parent child table
     */
    let filterQuery: any = {
      userId: userExists._id,
    };
    let updateQuery: any = {
      contactId: createAccountData.data.included[0].id,
      frontDocumentId: frontDocumentId,
      backDocumentId: backDocumentId,
      kycDocumentId: kycResponse.data.data.id,
    };
    if (userExists.type == EUserType.PARENT) {
      filterQuery = {
        ...filterQuery,
        "teens.childId": parentChildExists.firstChildId,
      };
      updateQuery = {
        ...updateQuery,
        contactId: createAccountData.data.included[0].id,
        frontDocumentId: frontDocumentId,
        backDocumentId: backDocumentId,
        kycDocumentId: kycResponse.data.data.id,
        "teens.$.accountId": createAccountData.data.data.id,
      };
    }
    if (userExists.type == EUserType.SELF) {
      updateQuery = {
        ...updateQuery,
        contactId: createAccountData.data.included[0].id,
        accountId: createAccountData.data.data.id,
      };
    }
    await ParentChildTable.updateOne(filterQuery, {
      $set: updateQuery,
    });

    /**
     * Parent event for kyc submitted
     */
    AnalyticsService.sendEvent(ANALYTICS_EVENTS.KYC_SUBMITTED, undefined, {
      user_id: userExists._id,
    });
    /**
     * Update the status to zoho crm
     */
    let dataSentInCrm: any = {
      Account_Name: userExists.firstName + " " + userExists.lastName,
      Email: userExists.email,
      Account_Status: "1",
      Parent_Signup_Funnel: [
        ...PARENT_SIGNUP_FUNNEL.SIGNUP,
        PARENT_SIGNUP_FUNNEL.DOB,
        PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
        PARENT_SIGNUP_FUNNEL.CHILD_INFO,
        PARENT_SIGNUP_FUNNEL.UPLOAD_DOCUMENT,
      ],
    };
    await zohoCrmService.addAccounts(
      ctx.request.zohoAccessToken,
      dataSentInCrm
    );

    return this.Ok(ctx, {
      data: kycResponse.data,
      message:
        "Your documents are uploaded successfully. We are currently verifying your documents. Please wait for 24 hours.",
    });
  }

  /**
   * @description This method is for update user's profile picture
   * @param ctx
   * @returns
   */
  @Route({
    path: "/update-profile-picture",
    method: HttpMethod.POST,
    middleware: [uploadFileS3.single("profile_picture")],
  })
  @Auth()
  public async updateProfilePicture(ctx: any) {
    const userExists: any = await UserTable.findOne({
      _id: ctx.request.body.userId
        ? ctx.request.body.userId
        : ctx.request.user._id,
    });
    const file = ctx.request.file;
    if (!file) {
      return this.BadRequest(ctx, "Image is not selected");
    }
    const imageName =
      file && file.key
        ? file.key.split("/").length > 0
          ? file.key.split("/")[1]
          : null
        : null;
    if (userExists.profilePicture) {
      await removeImage(userExists._id, userExists.profilePicture);
    }
    await UserTable.updateOne(
      { _id: userExists._id },
      {
        $set: { profilePicture: imageName },
      }
    );
    return this.Ok(ctx, { message: "Profile Picture updated successfully." });
  }
}

export default new UserController();
