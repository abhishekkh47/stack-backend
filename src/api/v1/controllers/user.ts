import BaseController from "./base";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import { validation } from "../../../validations/apiValidation";
import { ParentChildTable, UserTable, NotifyUserTable } from "../../../model";
import fs from "fs";
import { json } from "co-body";
import {
  agreementPreviews,
  createAccount,
  createProcessorToken,
  getPublicTokenExchange,
  kycDocumentChecks,
  Route,
  uploadFilesFetch,
  createContributions,
  getLinkToken,
  uploadFileS3,
  uploadIdProof,
  tempContribution,
  uploadImage,
  checkValidBase64String,
  // uploadProfilePicture,
} from "../../../utility";
import {
  EUSERSTATUS,
  EUserType,
  HttpMethod,
  ESCREENSTATUS,
} from "../../../types";
import path from "path";
import moment from "moment";
import { ObjectId } from "mongodb";
import { AuthService } from "../../../services";
const { GoogleSpreadsheet } = require("google-spreadsheet");

class UserController extends BaseController {
  /**
   * @description This method is for updating the tax information
   * @param ctx
   * @returns
   */
  @Route({ path: "/update-tax-info", method: HttpMethod.POST })
  @Auth()
  public async updateTaxInfo(ctx: any) {
    const input = ctx.request.body;
    const userExists = await UserTable.findOne({
      username: ctx.request.user.username,
    });
    if (!userExists) {
      return this.BadRequest(ctx, "User not found");
    }
    return validation.updateTaxInfoRequestBodyValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          await UserTable.updateOne(
            { username: ctx.request.user.username },
            {
              $set: {
                taxIdNo: input.taxIdNo,
                taxState: input.taxState,
                screenStatus:
                  userExists.type === EUserType.PARENT
                    ? ESCREENSTATUS.UPLOAD_DOCUMENTS
                    : ESCREENSTATUS.SIGN_UP,
              },
            }
          );
          return this.Ok(ctx, { message: "Tax info updated successfully." });
        }
      }
    );
  }

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
    const linkToken: any = await getLinkToken(userExists);
    if (linkToken.status == 400) {
      return this.BadRequest(ctx, linkToken.message);
    }
    return this.Ok(ctx, { data: linkToken.data });
  }

  /**
   * @description This method is used to send agreement previews to user
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/agreement-preview", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async sendAgreementPreview(ctx: any) {
    const user = ctx.request.user;
    const jwtToken = ctx.request.primeTrustToken;
    /**
     * Validations to be done
     */
    const userExists: any = await UserTable.findOne({ _id: user._id }).populate(
      "stateId",
      ["name", "shortName"]
    );
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const fullName = userExists.firstName + " " + userExists.lastName;
    const data = {
      type: "account",
      attributes: {
        "account-type": "custodial",
        name: fullName + " child-1",
        "authorized-signature": " ",
        owner: {
          "contact-type": "natural_person",
          name: fullName,
          email: userExists.email,
          "date-of-birth": moment(userExists.dob).format("MM/DD/YYYY"),
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
            "street-2": "",
            "postal-code": userExists.postalCode,
            city: userExists.city,
            region: userExists.stateId.shortName,
            country: userExists.country,
          },
        },
      },
    };
    /**
     * Send Agreement Previews
     */
    const sendAgreementPreview: any = await agreementPreviews(jwtToken, data);
    if (sendAgreementPreview.status == 400) {
      return this.BadRequest(ctx, sendAgreementPreview.message);
    }
    return this.Ok(ctx, { data: sendAgreementPreview.data.data });
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
  @PrimeTrustJWT()
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
      requestParams.id_proof_front
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
    const fullName = userExists.firstName + " " + userExists.lastName;
    const data = {
      type: "account",
      attributes: {
        "account-type": "custodial",
        name: fullName + " child-1",
        "authorized-signature": fullName,
        "webhook-config": {
          url: "http://34.216.120.156:3500/api/v1/webhook-response",
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
            region: userExists.stateId.shortName,
            country: userExists.country,
          },
        },
      },
    };
    const createAccountData: any = await createAccount(jwtToken, data);
    const errorResponse = {
      message: "Error in creating account in prime trust",
      data: createAccountData,
    };
    if (createAccountData.status == 400) {
      return this.BadRequest(ctx, errorResponse);
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
            ? "Front Side Driving License"
            : "Back Side Driving License",
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
    const messages = [
      "Your documents are uploaded. Please wait for some time till we verify and get back to you.",
    ];
    await UserTable.updateOne(
      {
        _id: userExists._id,
      },
      {
        $set: {
          status: EUSERSTATUS.KYC_DOCUMENT_UPLOAD,
          screenStatus: ESCREENSTATUS.ADD_BANK_ACCOUNT,
          kycMessages: messages,
        },
      }
    );
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
          contactId: createAccountData.data.included[0].id,
          "teens.$.accountId": createAccountData.data.data.id,
          frontDocumentId: frontDocumentId,
          backDocumentId: backDocumentId,
          kycDocumentId: kycResponse.data.data.id,
        },
      }
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
    let data = (
      await UserTable.aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "states",
            localField: "stateId",
            foreignField: "_id",
            as: "state",
          },
        },
        { $unwind: { path: "$state", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            email: 1,
            kycMessages: 1,
            username: 1,
            mobile: 1,
            address: 1,
            firstName: 1,
            lastName: 1,
            type: 1,
            parentMobile: 1,
            parentEmail: 1,
            country: 1,
            "state._id": 1,
            "state.name": 1,
            "state.shortName": 1,
            city: 1,
            postalCode: 1,
            unitApt: 1,
            liquidAsset: 1,
            taxIdNo: 1,
            taxState: 1,
            dob: 1,
            profilePicture: 1,
          },
        },
      ]).exec()
    )[0];
    if (!data) return this.BadRequest(ctx, "Invalid user ID entered.");
    return this.Ok(ctx, data, true);
  }

  /**
   * @description This method is used to update user's date of birth (DOB)
   * @param ctx
   * @returns
   */
  @Route({ path: "/update-dob", method: HttpMethod.POST })
  @Auth()
  public async updateDob(ctx: any) {
    const input = ctx.request.body;
    return validation.updateDobValidation(input, ctx, async (validate) => {
      if (validate) {
        if (
          (
            await UserTable.findOne(
              { _id: ctx.request.user._id },
              { type: 1, _id: 0 }
            )
          ).type === 2 &&
          new Date(Date.now() - new Date(input.dob).getTime()).getFullYear() <
            1988
        )
          return this.BadRequest(ctx, "Parent's age should be 18+");

        await UserTable.updateOne(
          { _id: ctx.request.user._id },
          { $set: { dob: input.dob } }
        );
        return this.Ok(ctx, {
          message: "Your Date of Birth updated successfully.",
        });
      }
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
    // middleware: [uploadFileS3.single("profile_picture")],
  })
  @Auth()
  public async updateProfilePicture(ctx: any) {
    const userExists: any = await UserTable.findOne({
      _id: ctx.request.user._id,
    });
    const requestParams = ctx.request.body;
    if (!requestParams.media) {
      return this.BadRequest(ctx, "Image is not selected");
    }
    let validBase64 = await checkValidBase64String(requestParams.media);
    if (!validBase64) {
      return this.BadRequest(ctx, "Please enter valid image");
    }
    const extension =
      requestParams.media && requestParams.media !== ""
        ? requestParams.media.split(";")[0].split("/")[1]
        : "";
    const imageName =
      requestParams.media && requestParams.media !== ""
        ? `profile_picture_${moment().unix()}.${extension}`
        : "";
    const imageExtArr = ["jpg", "jpeg", "png"];
    if (imageName && !imageExtArr.includes(extension)) {
      return this.BadRequest(ctx, "Please add valid extension");
    }
    let s3Path = `${userExists._id}`;
    const uploadImageRequest = await uploadImage(
      imageName,
      s3Path,
      ctx.request.body,
      ctx.response
    );
    // if (uploadImageRequest) {
    await UserTable.updateOne(
      { _id: ctx.request.user._id },
      {
        $set: { profilePicture: imageName },
      }
    );
    return this.Ok(ctx, { message: "Profile Picture updated successfully." });
  }
  // return this.BadRequest(ctx, "Error in Profile Image Upload");
  // }

  /**
   * @description This method is used to get child of parent
   * @param ctx
   * @returns
   */
  @Route({ path: "/get-children", method: HttpMethod.GET })
  @Auth()
  public async getChildren(ctx: any) {
    let teens = await ParentChildTable.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "teens.childId",
          foreignField: "_id",
          as: "teens",
        },
      },
      {
        $match: {
          userId: new ObjectId(ctx.request.user._id),
        },
      },
      {
        $project: {
          "teens.firstName": 1,
          "teens.lastName": 1,
          "teens.username": 1,
          "teens._id": 1,
          "teens.profilePicture": 1,
          _id: 0,
        },
      },
    ]).exec();
    if (teens.length == 0) return this.BadRequest(ctx, "No child found");
    teens = teens[0];
    return this.Ok(ctx, teens);
  }

  /**
   * @description This method is used to handle webhook failures respectively
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/upload-proof-of-address",
    method: HttpMethod.POST,
    middleware: [uploadIdProof.single("address_proof_front")],
  })
  @Auth()
  @PrimeTrustJWT()
  public async uploadProofOfAddress(ctx: any) {
    const files = ctx.request.file;
    const user = ctx.request.user;
    const jwtToken = ctx.request.primeTrustToken;
    if (!files) {
      return this.BadRequest(
        ctx,
        "Please upload proof of address in order to complete KYC"
      );
    }
    let existingStatus = (
      await UserTable.findOne(
        { _id: ctx.request.user._id },
        { status: 1, _id: 0 }
      )
    ).status;
    if (
      existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED ||
      existingStatus === EUSERSTATUS.KYC_DOCUMENT_UPLOAD
    ) {
      try {
        fs.unlinkSync(
          path.join(__dirname, "../../../../uploads", files.filename)
        );
      } catch (err) {}
      return this.BadRequest(
        ctx,
        existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED
          ? "User already verified."
          : "User's data already uploaded."
      );
    }
    /**
     * Validations to be done
     */
    const userExists: any = await UserTable.findOne({ _id: user._id }).populate(
      "stateId",
      ["name", "shortName"]
    );
    if (!userExists || userExists.type == EUserType.TEEN) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const parentChildExists = await ParentChildTable.findOne({
      userId: user._id,
    });
    if (!parentChildExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const accountIdDetails: any = await parentChildExists.teens.find(
      (x: any) =>
        x.childId.toString() == parentChildExists.firstChildId.toString()
    );
    if (!accountIdDetails) {
      return this.BadRequest(ctx, "Account Details Not Found");
    }
    const fullName = userExists.firstName + " " + userExists.lastName;

    /**
     * Upload both file
     */
    let addressDocumentId = null;
    let uploadFileError = null;
    let uploadData = {
      "contact-id": parentChildExists.contactId,
      description: "Proof of Address",
      label: "Proof of Address",
      public: "true",
      file: fs.createReadStream(
        path.join(__dirname, "../../../../uploads", files.filename)
      ),
    };
    let uploadFile: any = await uploadFilesFetch(jwtToken, uploadData);
    if (uploadFile.status == 400) {
      uploadFileError = uploadFile.message;
    }
    if (uploadFile.status == 200 && uploadFile.message.errors != undefined) {
      uploadFileError = uploadFile.message;
    }
    if (uploadFileError) {
      /**
       * Delete image from our server
       */
      try {
        fs.unlinkSync(
          path.join(__dirname, "../../../../uploads", files.filename)
        );
      } catch (err) {
        console.log("Error in removing image");
      }
      return this.BadRequest(ctx, uploadFileError);
    }
    addressDocumentId = uploadFile.message.data.id;
    /**
     * Checking the kyc document checks
     */
    const kycData = {
      type: "kyc-document-checks",
      attributes: {
        "contact-id": parentChildExists.contactId,
        "uploaded-document-id": addressDocumentId,
        "kyc-document-type": "residence_permit",
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
      return this.BadRequest(ctx, kycResponse.message);
    }
    const messages = [
      "Your documents are uploaded. Please wait for some time till we verify and get back to you.",
    ];
    await UserTable.updateOne(
      {
        _id: userExists._id,
      },
      {
        $set: {
          status: EUSERSTATUS.KYC_DOCUMENT_UPLOAD,
          kycMessages: messages,
        },
      }
    );
    /**
     * Updating the info in parent child table
     */
    await ParentChildTable.updateOne(
      { userId: user._id, "teens.childId": parentChildExists.firstChildId },
      {
        $set: {
          contactId: parentChildExists.contactId,
          "teens.$.accountId": accountIdDetails.accountId,
          proofOfAddressId: addressDocumentId,
          kycDocumentId: kycResponse.data.data.id,
        },
      }
    );
    return this.Ok(ctx, {
      data: kycResponse.data,
      message:
        "Your documents are uploaded successfully. We are currently verifying your documents. Please wait for 24 hours.",
    });
  }

  /**
   * @description This method is used to notify user.
   * @param ctx
   * @returns
   */
  @Route({ path: "/notify-user", method: HttpMethod.POST })
  public async notifyUsers(ctx: any) {
    const input = ctx.request.body;
    return validation.notifyUserInputValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          await NotifyUserTable.create(input);
          return this.Ok(ctx, { message: "Notified successfully." });
        }
      }
    );
  }

  /**
   * @description This method is used for script of 250 user in beta testing
   * @param ctx
   * @returns
   */
  @Route({ path: "/temp", method: HttpMethod.POST })
  @PrimeTrustJWT()
  public async temp(ctx: any) {
    const getMobileNubmer = (template, number) => {
      switch (`${number}`.length) {
        case 1:
          return `${template}000${number}`;
        case 2:
          return `${template}00${number}`;
        case 3:
          return `${template}0${number}`;
        case 4:
          return `${template}${number}`;
        default:
          return `${template}0000`;
      }
    };

    const { contactId } = ctx.request.body;
    const jwtToken = ctx.request.primeTrustToken;
    const mobileNubmerTemp = (() => {
      let areaCodes = [
        212, 315, 332, 347, 516, 518, 585, 607, 631, 646, 680, 716, 718, 838,
        845, 914, 917, 929, 934, 201, 551, 609, 640, 732, 848, 856, 862, 908,
        973, 215, 223, 267, 272, 412, 484, 610, 717, 724, 814, 878,
      ];
      return `+1${areaCodes[Math.floor(Math.random() * areaCodes.length)]}${
        areaCodes[Math.floor(Math.random() * areaCodes.length)]
      }`;
    })();
    const AMOUNT_TO_BE_ADDED = 500;

    const parentChild = await ParentChildTable.findOne({ contactId });
    if (!parentChild)
      return this.BadRequest(ctx, "Contact ID not found in any parent");

    const parent = await UserTable.findOne({ _id: parentChild.userId });
    if (!parent) return this.BadRequest(ctx, "Account not found");

    const doc = new GoogleSpreadsheet(
      "1Rrp1gXP6DMiWkuZ49xe0BjXNPE0ZMygjV62OQtb_09U"
    );
    await doc.useServiceAccountAuth({
      type: "service_account",
      project_id: "stack-995ed",
      private_key_id: "393a402f6630823c778e76deb92074e9c7c30366",
      private_key:
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7WaGovxzBp7zB\n1VrDgB80TwqtBQfIAZj2/NDqYsmGA4rdvVxUKlVNdoXogPQn0hE6TPNhk7wHcjQY\ni4gQkPppwcHrkG2MBUOvx09FhrUxZKuZO9j9egjGKR5H32X16bhzq8C2LZNqxv7j\n0h8yyfSe9TD8e9bF54J/H0R1ljjD7wGp8Ml1dsGcVvr4vUBZaDJtlb+tQtDkZhRi\nAscYRwMCXHIiAe5Nuhu3rh1BH9MsvQqdDTQFCcmA6K9If8nzDwc1tDutf9/iXBdV\nVUZ1hPDM9oCFwGU/Qyq+If3aIjWmMfk9lATv461K0BhOpLHxU4F0ypblEPZXh/Lp\nAQlP+tuLAgMBAAECggEAO65Q1h2TPol9ks2xbSfKSPKI9xbsJKWFoeBleNThV4SX\nXw2sdM9LfzKrc6ZooKrFfCn5OfNC6ahSuiLwxD461ye266CFlR40MrGuKfrAi6yD\nEXxEInMWinGcyM58f3rlnEtxR1d7Z39ewRo1gAtflqeK5FNa1o5qPq6qMz8YdCmI\n0c43Nw2XU1Y4pODGrPB0kMCFde/nLxbvgeq47ch2BO1sxMKQ81X9HH+fT52eUDHO\n5montTKSKx+0lYYN3pbSpZsPuzLsPVmPXNWG+GlUDk6PSUO+nlVtRdAXOlxJXv0S\nD9XMpRPjjcwSHTzvfEMjPlSq3+CZ/xUr2Fk80B/xyQKBgQD/cExGUagExtRLydUE\nHGz0rq5Usw+hlDQdGyt4mWKdcRGPBNQPTTMvOojaHoHV/Lt70L39iJCYjiMyPVn8\nqfEbWtfFnSkxejjnw81t4Wduinv9b3mDrVPCprhNDKAaCevJ27ZPbaW/lj/+Ae0/\nTzeRvCnk+6MAgvM6YGDtt+MA5wKBgQC7wwdrciEWKm61khd8xzZzG9OclcFHYl3O\n/zOuLzggSwYsR+Wc6NMkB/VB96aigpdXMrYRRzC3bsTz1n9vOdRegI2MliMDzE+E\nfgjyJW6eQkyhq91BUCjfYEulwtu2NcrvpN5zfXP8OkzVNckVmMUWr17q4DPThjws\n+Fig/cAnvQKBgFJ9RWSAAi5oty4yY6QMOfNaZdncaXPYlGvB1mv/vKTzWqRA/upi\nF+Fsmb02lN8x2qnFY1V4wJlDbYJP5bt+depLj9q1QhREUBQoWzLc07YS6q+RTECF\nvMLjbCkVpq5B/e8WEO3djuUr9EZnAOKtBlj91tmnmaAUqc90SFj8RUaJAoGAYZhp\nNec33X6m1wgd30TpP4HaR4zrzwAJRLwQD90JbnewuLmSVzIJ9bORPv3MBrKcmb2J\nN4fqgZ45D4mR6a2Efq6RZN7xSlsbhgHBAqSEUAykKnDb68QPyrQR/hJABAEH//KR\nkjRGYnenUjfH0sr6vuTfEHUDW1Jt2u4nm17qT30CgYEA6lUFlVuP7f9wPxEKkeP/\n0l4Lm88WS3s430bZwNC6VdpvxZ+m7osaKjfEBPxjLj/q368pvKNnBCnpYkiqN2kV\nWux22uz1QVSdUelXduYRm2bmcLGa3ZE9suTVGaeDHWIBVXc9OMY8BlCdbUwHEDBW\n378JF3JO/IFgv9wmkSuEeCo=\n-----END PRIVATE KEY-----\n",
      client_email:
        "firebase-adminsdk-tp43e@stack-995ed.iam.gserviceaccount.com",
      client_id: "111578768458458128917",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-tp43e%40stack-995ed.iam.gserviceaccount.com",
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const emails = rows.map((item) => item._rawData[0]);

    let children = [];
    let toBePushedInTeens = [];

    for (let i = 0; i < emails.length; i++) {
      children.push({
        email: `${emails[i]}`,
        username: `${parent.username}#teen-${parentChild.teens.length + 1 + i}`,
        mobile: `${getMobileNubmer(
          mobileNubmerTemp,
          parentChild.teens.length + 1 + i
        )}`,
        firstName: `${parent.firstName}${parentChild.teens.length + 1 + i}`,
        lastName: `${parent.lastName}${parentChild.teens.length + 1 + i}`,
        password: AuthService.encryptPassword("TempTemp1"),
        type: 1,
        parentEmail: parent.email,
        parentMobile: parent.mobile,
      });

      let response: any = await createAccount(jwtToken, {
        type: "accounts",
        attributes: {
          name: `${parent.firstName} ${parent.lastName} CHILD-${
            parentChild.teens.length + 1 + i
          }`,
          "authorized-signature": `${parent.firstName} ${parent.lastName}`,
          "account-type": "custodial",
          "contact-id": contactId,
        },
      });
      if (response.status === 400) return this.BadRequest(ctx, response);

      let contributionResponse = await tempContribution(
        jwtToken,
        response.data.data.id,
        {
          data: {
            type: "accounts",
            attributes: { amount: AMOUNT_TO_BE_ADDED },
          },
        }
      );
      if (contributionResponse.status === 400)
        return this.BadRequest(ctx, contributionResponse);

      // const currentChild = await UserTable.create(children[i]);

      toBePushedInTeens.push({
        accountId: response.data.data.id,
        accountNumber: response.data.data.attributes.number,
      });
      // await ParentChildTable.updateOne(
      //   { userId: parent._id },
      //   {
      //     $push: { teens: toBePushed }
      //   }
      // );
    }

    const addedChildren = await UserTable.insertMany(children);

    for (let j = 0; j < emails.length; j++) {
      toBePushedInTeens[j].childId = addedChildren[j]._id;
      await ParentChildTable.updateOne(
        { userId: parent._id },
        { $push: { teens: toBePushedInTeens[j] } }
      );
    }

    return this.Ok(ctx, {});
  }

  /**
   * @description This method is used for acknowelegement of user
   * @param ctx
   * @returns
   */
  @Route({ path: "/acknowledge", method: HttpMethod.POST })
  @Auth()
  public async consent(ctx: any) {
    if (
      (
        await UserTable.findOne(
          { _id: new ObjectId(ctx.request.user._id) },
          { type: 1, _id: 0 }
        )
      ).type === 1
    )
      return this.BadRequest(ctx, "Requested user is Teen");
    await UserTable.updateOne(
      { _id: new ObjectId(ctx.request.user._id) },
      { $set: { isAcknowledged: 1 } }
    );
    return this.Ok(ctx, { message: "Acknowledged" });
  }
}

export default new UserController();
