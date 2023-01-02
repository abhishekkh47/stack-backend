import { OtpTable } from "./../../../model/otp";
import { json } from "co-body";
import fs from "fs";
import moment from "moment";
import path from "path";
import envData from "../../../config/index";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import { ParentChildTable, UserTable } from "../../../model";
import {
  DeviceTokenService,
  userService,
  zohoCrmService,
} from "../../../services";
import { EUSERSTATUS, EUserType, HttpMethod } from "../../../types";
import {
  checkValidBase64String,
  createAccount,
  getLinkToken,
  kycDocumentChecks,
  Route,
  uploadFilesFetch,
  uploadIdProof,
} from "../../../utility";
import {
  CMS_LINKS,
  NOTIFICATION,
  NOTIFICATION_KEYS,
  PARENT_SIGNUP_FUNNEL,
} from "../../../utility/constants";
import { UserBanksTable } from "./../../../model/userBanks";
import BaseController from "./base";

class UserController extends BaseController {
  /**
   * @description This method is for getting the link token
   * @param ctx
   * @returns
   */
  @Route({ path: "/get-link-token", method: HttpMethod.GET })
  @Auth()
  public async getLinkToken(ctx: any) {
    const userExists = await UserTable.findOne({ _id: ctx.request.user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (!ctx.request.query.deviceType) {
      return this.BadRequest(ctx, "Please enter device type");
    }

    let userBankExists = await UserBanksTable.findOne({
      userId: userExists._id,
    });
    const linkToken: any = await getLinkToken(
      userExists,
      userBankExists && userBankExists.accessToken
        ? userBankExists.accessToken
        : null,
      ctx.request.query.deviceType
    );
    if (linkToken.status == 400) {
      return this.BadRequest(ctx, linkToken.message);
    }
    return this.Ok(ctx, { data: linkToken.data });
  }

  /**
   * @description This method is used to upload files
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/upload-id-proof",
    method: HttpMethod.POST,
  })
  @Auth()
  @PrimeTrustJWT(true)
  public async uploadFilesData(ctx: any) {
    const body = await json(ctx, { limit: "150mb" });
    const jwtToken = ctx.request.primeTrustToken;
    const userExists: any = await UserTable.findOne({
      _id: ctx.request.user._id,
    }).populate("stateId", ["name", "shortName"]);
    const requestParams = body;
    if (!requestParams.id_proof_front) {
      return this.BadRequest(
        ctx,
        "Please select front image of driving license"
      );
    }
    if (!requestParams.id_proof_back) {
      return this.BadRequest(
        ctx,
        "Please select back image of driving license"
      );
    }
    let validBase64Front = await checkValidBase64String(
      requestParams.id_proof_front
    );
    if (!validBase64Front) {
      return this.BadRequest(ctx, "Please enter valid image");
    }
    let validBase64Back = await checkValidBase64String(
      requestParams.id_proof_back
    );
    if (!validBase64Back) {
      return this.BadRequest(ctx, "Please enter valid image");
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
    let files = [
      { id_proof_front: requestParams.id_proof_front },
      { id_proof_back: requestParams.id_proof_back },
    ];
    /**
     * Upload image front and back accordingly
     */
    let validExtensionExists = false;
    let newArrayFiles = [];
    for await (let identificationFile of files) {
      const extension =
        identificationFile.id_proof_front &&
        identificationFile.id_proof_front !== ""
          ? identificationFile.id_proof_front.split(";")[0].split("/")[1]
          : identificationFile.id_proof_back &&
            identificationFile.id_proof_back !== ""
          ? identificationFile.id_proof_back.split(";")[0].split("/")[1]
          : "";
      const imageName =
        identificationFile.id_proof_front &&
        identificationFile.id_proof_front !== ""
          ? `id_proof_front_${moment().unix()}.${extension}`
          : `id_proof_back_${moment().unix()}.${extension}`;
      const imageExtArr = ["jpg", "jpeg", "png"];
      if (imageName && !imageExtArr.includes(extension)) {
        validExtensionExists = true;
        break;
      }
      const decodedImage = Buffer.from(
        identificationFile.id_proof_front
          ? identificationFile.id_proof_front.replace(
              /^data:image\/\w+;base64,/,
              ""
            )
          : identificationFile.id_proof_back.replace(
              /^data:image\/\w+;base64,/,
              ""
            ),
        "base64"
      );
      if (!fs.existsSync(path.join(__dirname, "../../../../uploads"))) {
        fs.mkdirSync(path.join(__dirname, "../../../../uploads"));
      }
      fs.writeFileSync(
        path.join(__dirname, "../../../../uploads", imageName),
        decodedImage,
        "base64"
      );
      newArrayFiles.push({
        fieldname: identificationFile.id_proof_front
          ? "id_proof_front"
          : "id_proof_back",
        filename: imageName,
      });
    }
    if (validExtensionExists) {
      return this.BadRequest(ctx, "Please add valid extension");
    }
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
            // region: userExists.stateId.shortName,
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
          path.join(__dirname, "../../../../uploads", fileData.filename)
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
          path.join(__dirname, "../../../../uploads", fileData.filename)
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
     * Update the status to zoho crm
     */
    let dataSentInCrm: any = {
      Account_Name: userExists.firstName + " " + userExists.lastName,
      Email: userExists.email,
      Account_Status: "1",
      Parent_Signup_Funnel: [
        ...PARENT_SIGNUP_FUNNEL.SIGNUP,
        PARENT_SIGNUP_FUNNEL.DOB,
        PARENT_SIGNUP_FUNNEL.MOBILE_NUMBER,
        PARENT_SIGNUP_FUNNEL.CHILD_INFO,
        PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
        PARENT_SIGNUP_FUNNEL.UPLOAD_DOCUMENT,
      ],
    };
    await zohoCrmService.addAccounts(
      ctx.request.zohoAccessToken,
      dataSentInCrm
    );

    /**
     * Kyc pending mode call
     */
    await DeviceTokenService.sendUserNotification(
      userExists._id,
      NOTIFICATION_KEYS.KYC_PENDING,
      NOTIFICATION.KYC_PENDING_TITLE,
      NOTIFICATION.KYC_PENDING_DESCRIPTION
    );

    return this.Ok(ctx, {
      data: kycResponse.data,
      message:
        "Your documents are uploaded successfully. We are currently verifying your documents. Please wait for 24 hours.",
    });
  }

  /**
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/get-profile/:id", method: HttpMethod.GET })
  @Auth()
  public async getProfile(ctx: any) {
    const { id } = ctx.request.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id))
      return this.BadRequest(ctx, "Enter valid ID.");
    let { data, userDraft } = await userService.getProfile(id);
    console.log("userDraft: ", userDraft);
    console.log("data: ", data);
    const matchObject = {
      receiverMobile: data ? data.mobile : userDraft.mobile,
      isVerified: 1,
    };
    console.log("matchObject: ", matchObject);

    const checkNumberVerifiedOrNot = await OtpTable.findOne(matchObject);

    if (data) {
      if (checkNumberVerifiedOrNot) {
        data.isMobileVerified = 1;
      }
      const checkParentExists = await UserTable.findOne({
        mobile: data.parentMobile ? data.parentMobile : data.mobile,
      });
      const checkBankExists =
        checkParentExists?._id &&
        (await UserBanksTable.find({
          userId: checkParentExists._id,
        }));
      if (
        !checkParentExists ||
        (checkParentExists &&
          checkParentExists.status !== EUSERSTATUS.KYC_DOCUMENT_VERIFIED)
      ) {
        data.isParentApproved = 0;
      } else {
        data.isParentApproved = 1;
      }
      if (
        !checkParentExists ||
        (checkParentExists && checkBankExists.length == 0)
      ) {
        data.isRecurring = 0;
      } else if (checkBankExists.length > 0) {
        if (data.isRecurring == 1 || data.isRecurring == 0) {
          data.isRecurring = 1;
        }
      }
    }
    console.log(checkNumberVerifiedOrNot);
    if (checkNumberVerifiedOrNot && userDraft) {
      userDraft.isMobileVerified = 1;
    }

    data = {
      ...data,
      terms: CMS_LINKS.TERMS,
      amcPolicy: CMS_LINKS.AMC_POLICY,
      privacy: CMS_LINKS.PRIVACY_POLICY,
      ptUserAgreement: CMS_LINKS.PRIME_TRUST_USER_AGREEMENT,
    };

    return this.Ok(ctx, userDraft ? userDraft : data, true);
  }
}

export default new UserController();
