import BaseController from "./base";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import { validation } from "../../../validations/apiValidation";
import { ParentChildTable, UserTable, NotifyUserTable } from "../../../model";
import fs from "fs";
import { json, form } from "co-body";
import {
  agreementPreviews,
  createAccount,
  kycDocumentChecks,
  Route,
  uploadFilesFetch,
  getLinkToken,
  uploadIdProof,
  tempContribution,
  uploadImage,
  checkValidBase64String,
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
import { FIREBASE_CREDENCIALS } from "../../../utility/constants";
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
      return this.BadRequest(ctx, errorResponse.message);
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
    await UserTable.updateOne(
      {
        _id: userExists._id,
      },
      {
        $set: {
          status: EUSERSTATUS.KYC_DOCUMENT_UPLOAD,
          screenStatus: ESCREENSTATUS.ACKNOWLEDGE_SCREEN,
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
          $addFields: {
            isParentApproved: 0,
          },
        },
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
            isParentApproved: 1,
            parentMobile: 1,
            parentEmail: 1,
            country: 1,
            "state._id": 1,
            "state.name": 1,
            "state.shortName": 1,
            screenStatus: 1,
            city: 1,
            postalCode: 1,
            unitApt: 1,
            liquidAsset: 1,
            taxIdNo: 1,
            taxState: 1,
            status: 1,
            dob: 1,
            profilePicture: 1,
          },
        },
      ]).exec()
    )[0];
    if (!data) return this.BadRequest(ctx, "Invalid user ID entered.");
    if (data.type == EUserType.TEEN) {
      const checkParentExists = await UserTable.findOne({
        email: data.parentEmail,
      });
      if (
        !checkParentExists ||
        (checkParentExists &&
          checkParentExists.status !== EUSERSTATUS.KYC_DOCUMENT_VERIFIED)
      ) {
        data.isParentApproved = 0;
      } else {
        data.isParentApproved = 1;
      }
    }
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

    // const doc = new GoogleSpreadsheet(
    //   "1RXMtUAo1d0_xzv4H-E-4sY_sDNeF2QdVBHFaX3AqT3w"
    // );
    // await doc.useServiceAccountAuth(FIREBASE_CREDENCIALS);
    // await doc.loadInfo();
    // const sheet = doc.sheetsByIndex[0];
    // const rows = await sheet.getRows();
    const emails = [
      "callum@iunitemedia.co.uk",
      "leehill2591@gmail.com",
      "ree2mazz@gmail.com",
      "rushw2@yahoo.com",
      "customerservice@trystack.io",
      "wrush08@gmail.com",
      "cdkiesau@gmail.com",
      "janessabricker14@gmail.com",
      "jafrican1business@gmail.com",
      "sawyer.h701@gmail.com",
      "16018183093@tmomail.net",
      "12015623241@tmomail.net",
      "ktong0422@yahoo.com",
      "rogernguyen040907@gmail.com",
      "bennettjude6@gmail.com",
      "thechris2nerdy@gmail.com",
      "jamessadler33@gmail.com",
      "shanefrench@gmail.com",
      "thoedemaker1@gmail.com",
      "schmitt.robb@gmail.com",
      "burns.nelson@gmail.com",
      "robert@justmystic.com",
      "djemurphy4@gmail.com",
      "hoedyb@msn.com",
      "bmahoney1105@gmail.com",
      "17783008960@tmomail.net",
      "mhaze70@gmail.com",
      "kassibrownlow15@gmail.com",
      "16103044635@tmomail.net",
      "josef.leventon@gmail.com",
      "14258907790@vzwpix.com",
      "17325899570@vzwpix.com",
      "harrison@joinbumper.com",
      "will@trystack.io",
      "ken@packvc.com",
      "reetumaz@hotmail.com",
      "alistachan05@gmail.com",
      "eoin1589@gmail.com",
      "16056912569@tmomail.net",
      "omar@techranchaustin.com",
      "12513914633@tmomail.net",
      "acogotovac@gmail.com",
      "cg632093@gmail.com",
      "luckjess97@gmail.com",
      "cammomac05@gmail.com",
      "16478613571@vzwpix.com",
      "savsani.preet1510@gmail.com",
      "jasmeensagotra@gmail.com",
      "17788610023@tmomail.net",
      "deep.deepikarani@gmail.com",
      "shaken.bala@gmail.com",
      "15194760831@tmomail.net",
      "harmanpreetsinghmukar@gmail.com",
      "15145861886@tmomail.net",
      "19493397564@vzwpix.com",
      "15145819623@tmomail.net",
      "masumpatel22599@gmail.com",
      "14698059468@tmomail.net",
      "14385004984@vzwpix.com",
      "12268994889@vzwpix.com",
      "16479159745@tmomail.net",
      "18189707563@tmomail.net",
      "renjuskoshy@gmail.com",
      "16608511188@tmomail.net",
      "deepshikha73@gmail.com",
      "spiderpig391@gmail.com",
      "amnaraza2340@gmail.com",
      "harany.sivarasa@gmail.com",
      "annedemiberg@gmail.com",
      "viviththashrirajh@gmail.com",
      "15088461482@tmomail.net",
      "andreeacioc2@gmail.com",
      "samclifford05@gmail.com",
      "erocks2004@gmail.com",
      "12095501250@tmomail.net",
      "kevincraiu138@gmail.com",
      "karmacard@icloud.com",
      "hclarkehawkins@outlook.com",
      "sidra.m55@icloud.com",
      "adrianszymanski05@gmail.com",
      "13129720191@tmomail.net",
      "jamiahwashington515@gmail.com",
      "grace.littlewoodd@gmail.com",
      "harveybanks8@gmail.com",
      "byrne.estelle@gmail.com",
      "brxxkew2203@gmail.com",
      "adamrogers090905@yahoo.com",
      "adrian.jurys2007@gmail.com",
      "bprecaj@gmail.com",
      "hibahk17569@gmail.com",
      "adelhaj1516@gmail.com",
      "kballer665@gmail.com",
      "16107621501@vzwpix.com",
      "18322505667@vzwpix.com",
      "jenicha.kunalan@yahoo.com",
      "epybabasa@gmail.com",
      "18102620235@vzwpix.com",
      "dubeyapeksha3@gmail.com",
      "velascoaxel131@gmail.com",
      "rushanw12@gmail.com",
      "iiamfadils@gmail.com",
      "danielehimhen@gmail.com",
      "s.goraya@gmail.com",
      "ross.crawford777@gmail.com",
      "ryanpattisontest@gmail.com",
      "16475332446@tmomail.net",
      "basketballtom1@gmail.com",
      "15167764080@tmomail.net",
      "15149831166@vzwpix.com",
      "ryewylie2@icloud.com",
      "xdjakezz@yahoo.com",
      "13szirakimarci@gmail.com",
      "marcus.nilsson0601@gmail.com",
      "kiaracrhindluke@gmail.com",
      "ibraheemkantharia16@gmail.com",
      "mikey210605@gmail.com",
      "kian.heneghan@gmail.com",
      "isa.jimenezt159@gmail.com",
      "rubadub0809@gmail.com",
      "elanriza20@gmail.com",
      "esapesa83@gmail.com",
      "louiemagri@icloud.com",
      "afifsipad@gmail.com",
      "silkpuffgirl@gmail.com",
      "14255919064@vzwpix.com",
      "tinishacromwell@gmail.com",
      "annieonceu18@gmail.com",
      "14692613034@tmomail.net",
      "werokrol12@gmail.com",
      "sebastianru8@gmail.com",
      "sebastianbuiss@gmail.com",
      "17174042597@tmomail.net",
      "samsyl123@icloud.com",
      "caryscook0204@icloud.com",
      "sabontih23@gmail.com",
      "belltom14@gmail.com",
      "boltukassuniukas@gmail.com",
      "ollysanday@gmail.com",
      "b3llacho@gmail.com",
      "jackmnorris@icloud.com",
      "gracehillery45@gmail.com",
      "gml7011@icloud.com",
      "omar.v.chavez@icloud.com",
      "alexhopwood9876@gmail.com",
      "rogtwist1@gmail.com",
      "slea10@icloud.com",
      "15597795637@tmomail.net",
      "michaelsutcliffe73@yahoo.com",
      "ameliaeviereilly@icloud.com",
      "legendbeastgamer9@gmail.com",
      "shanehersey2007@gmail.com",
      "aaronjames@me.com",
      "jasonkgrube@gmail.com",
      "yakshatp06@gmail.com",
      "srsrush@aol.com",
      "llawa@bgsapps.co.uk",
      "maya.breeze05@gmail.com",
      "14036010607@tmomail.net",
      "laurenjdaniel@gmail.com",
      "19565215078@tmomail.net",
      "dejerseyjacob@gmail.com",
      "frankielvenditto@gmail.com",
      "ytcentral2016@gmail.com",
      "elimar2073@icloud.com",
      "am33rah.kamran@gmail.com",
      "omolemo135@gmail.com",
      "12265075458@vzwpix.com",
      "lara8rose@icloud.com",
      "harryamoss@icloud.com",
      "kmussington05@gmail.com",
      "brian.crouch@becu.org",
      "joshuatitus69420@gmail.com",
      "jcrisser1@gmail.com",
      "rifalalnajdy75@gmail.com",
      "samsonsalaam@outlook.com",
      "15625079266@tmomail.net",
      "19512362531@tmomail.net",
      "diggypiggy81@gmail.com",
      "cwatkins081@gmail.com",
      "harridurks@icloud.com",
      "13124784834@vzwpix.com",
      "joelmarshking1900@gmail.com",
      "18168839035@tmomail.net",
      "harps_sidhu@yahoo.co.uk",
      "17327621499@tmomail.net",
      "14782994377@vzwpix.com",
      "17jcuthbert@wardenparkradio.net",
      "lucaszaniecki@gmail.com",
      "17067686360@vzwpix.com",
      "15157325174@vzwpix.com",
      "zazalicksdoodoo@gmail.com",
      "oli.j.roberts@icloud.com",
      "18123503877@tmomail.net",
      "16026019822@vzwpix.com",
      "17607825761@vzwpix.com",
      "kala41150@gmail.com",
      "lucashorswell12102007@gmail.com",
      "t13g0436@hotmail.com",
      "15303120723@vzwpix.com",
      "oliverblundell@yahoo.com",
      "14383784440@vzwpix.com",
      "br16n.t88@gmail.com",
      "sclarke4732@gmail.com",
      "harisdukic8@gmail.com",
      "kobach@uw.edu",
      "12292203778@vzwpix.com",
      "17802570658@vzwpix.com",
      "14169910179@tmomail.net",
      "malachymcintyre@gmail.com",
      "joshua2005houston@gmail.com",
      "sadiqosman48@hotmail.com",
      "ta248874@gmail.com",
      "chrisg107103@gmail.com",
      "19728987413@tmomail.net",
      "12676259307@tmomail.net",
      "domcheath@gmail.com",
      "mubarak.abroaf@gmail.com",
      "ashercryptos@gmail.com",
      "deathlock1274@gmail.com",
      "13476148450@vzwpix.com",
      "knmasama0@gmail.com",
      "luciawright2@icloud.com",
      "renpoppitt@gmail.com",
      "15179905063@vzwpix.com",
      "nsalma08@outlook.com",
      "16106807183@tmomail.net",
      "jenkinsjoshua963@gmail.com",
      "mick32snow@gmail.com",
      "rodneytamnguyen@gmail.com",
      "daniyal160616@icloud.com",
      "davidresendiz248@gmail.com",
      "wrush08@yahoo.com",
      "bennettjude5@gmail.com",
      "19842259965@vzwpix.com",
      "ahmed.mohamed.albashir@gmail.com",
      "rcg8@outlook.com",
      "17729259580@vzwpix.com",
      "edgarthompson710@gmail.com",
      "mlennox228@gmail.com",
      "benjamind2412@gmail.com",
      "18456489211@tmomail.net",
      "13065908846@tmomail.net",
      "mcguffogelliot22@gmail.com",
      "jaynicholls789@icloud.com",
      "family9865@gmail.com",
      "aedawson23@gmail.com",
      "17734261128@mms.uscc.net",
      "13238728062@tmomail.net",
      "12092718290@tmomail.net",
      "12054542523@tmomail.net",
    ];

    let children = [];
    let toBePushedInTeens = [];
    for (let i = 0; i < emails.length; i++) {
      children.push({
        email: `${emails[i]}`,
        username: `StackUser${parentChild.teens.length + 1 + i}`,
        mobile: `${getMobileNubmer(
          mobileNubmerTemp,
          parentChild.teens.length + 1 + i
        )}`,
        firstName: "Stack",
        lastName: `User${parentChild.teens.length + 1 + i}`,
        password: AuthService.encryptPassword("Stack123!"),
        type: 1,
        parentEmail: parent.email,
        parentMobile: parent.mobile,
      });

      let response: any = await createAccount(jwtToken, {
        type: "accounts",
        attributes: {
          name: `StackUser${parentChild.teens.length + 1 + i}`,
          "authorized-signature": `${parent.firstName} ${parent.lastName}`,
          "account-type": "custodial",
          "contact-id": contactId,
        },
      });
      if (response.status === 400)
        return this.Ok(ctx, {
          response,
          message: `Stopped from creating acc ${i}`,
        });

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
        return this.Ok(ctx, {
          contributionResponse,
          message: `Stopped from contribution ${i}`,
        });

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

    return this.Ok(ctx, { message: "success" });
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
      {
        $set: {
          isAcknowledged: 1,
          screenStatus: ESCREENSTATUS.ADD_BANK_ACCOUNT,
        },
      }
    );
    return this.Ok(ctx, { message: "Acknowledged" });
  }
}

export default new UserController();
