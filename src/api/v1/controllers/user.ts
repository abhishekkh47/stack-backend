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
    const parentExists = await ParentChildTable.findOne({
      userId: userExists._id,
    });
    if (!parentExists) {
      return this.BadRequest(ctx, "User Details Not Found");
    }
    const fullName = userExists.firstName + " " + userExists.lastName;
    const data = {
      type: "agreement-previews",
      attributes: {
        "account-type": "custodial",
        name: fullName + " child-1",
        "authorized-signature": " ",
        // "contact-id": parentExists.contactId,
        owner: {
          "contact-type": "natural_person",
          name: "Rohan Patel",
          email: "rohan@email.in",
          "tax-id-number": "123123123456",
          "tax-country": "IN",
          "date-of-birth": "1993-03-16",
          sex: "male",
          "primary-phone-number": {
            country: "IN",
            number: "99209145545",
            sms: true,
          },
          "primary-address": {
            "street-1": "123 MK Road",
            "street-2": "Flat 3",
            "postal-code": "400020",
            city: "Mumbai",
            region: "Maharashtra",
            country: "IN",
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
    const fullName = userExists.firstName + " " + userExists.lastName;
    const childName =
      firstChildExists.firstName + " " + firstChildExists.lastName;
    const data = {
      type: "account",
      attributes: {
        "account-type": "custodial",
        name: childName + " - " + fullName,
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
    console.log(createAccountData, "createAccountData");
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
          screenStatus: ESCREENSTATUS.ADD_BANK_ACCOUNT,
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
  @Route({ path: "/user-waitlist", method: HttpMethod.POST })
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

    const { contactId, emails } = ctx.request.body;
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
    // let main = [];
    // rows.map((item) => {
    //   if (item._rawData[1] > 1700 && item._rawData[1] < 1759)
    //     main.push(item._rawData[0]);
    // });
    // return this.Ok(ctx, { data: emails });

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
          screenStatus: ESCREENSTATUS.UPLOAD_DOCUMENTS,
        },
      }
    );
    return this.Ok(ctx, { message: "Acknowledged" });
  }
}

export default new UserController();
