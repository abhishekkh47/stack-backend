import BaseController from "./base";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import { validation } from "../../../validations/apiValidation";
import { ParentChildTable, UserTable } from "../../../model";
import fs from "fs";
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
  uploadIdProof,
  uploadProfilePicture,
} from "../../../utility";
import { EUSERSTATUS, EUserType, HttpMethod } from "../../../types";
import path from "path";
import moment from "moment";
import { ObjectId } from "mongodb";

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
    console.log(data.attributes.owner["primary-address"], "data");
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
    middleware: [
      uploadIdProof.fields([
        {
          name: "front_side",
          maxCount: 1,
        },
        { name: "back_side", maxCount: 1 },
      ]),
    ],
  })
  @Auth()
  @PrimeTrustJWT()
  public async uploadFilesData(ctx: any) {
    const files = ctx.request.files;
    const user = ctx.request.user;
    const jwtToken = ctx.request.primeTrustToken;
    if (files.length == 0) {
      return this.BadRequest(
        ctx,
        "Please upload identification files in order to complete KYC"
      );
    }
    let newArrayFiles = [];
    if (!files.front_side || !files.back_side) {
      return this.BadRequest(
        ctx,
        "You need to upload front and back side of driver's license"
      );
    }
    newArrayFiles = [...files.front_side, ...files.back_side];
    if (newArrayFiles.length != 2) {
      return this.BadRequest(
        ctx,
        "You need to upload front and back side of driver's license"
      );
    }
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
    const parentChildExists = await ParentChildTable.findOne({
      userId: user._id,
    });
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
            "street-2": userExists.unitApt,
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
    for await (let identificationFile of newArrayFiles) {
      let uploadData = {
        "contact-id": createAccountData.data.included[0].id,
        description:
          identificationFile.fieldname == "front_side"
            ? "Front Side Driving License"
            : "Back Side Driving License",
        label:
          identificationFile.fieldname == "front_side"
            ? "Front Side Driving License"
            : "Back Side Driving License",
        public: "true",
        file: fs.createReadStream(
          path.join(__dirname, "../../../uploads", identificationFile.filename)
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
      identificationFile.fieldname == "front_side"
        ? (frontDocumentId = uploadFile.message.data.id)
        : (backDocumentId = uploadFile.message.data.id);
      /**
       * Delete image from our server
       */
      try {
        fs.unlinkSync(
          path.join(__dirname, "../../../uploads", identificationFile.filename)
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
          contactId: createAccountData.data.included[0].id,
          "teens.$.accountId": createAccountData.data.data.id,
          frontDocumentId: frontDocumentId,
          backDocumentId: backDocumentId,
          kycDocumentId: kycResponse.data.data.id,
        },
      }
    );
    return this.Ok(ctx, {
      data: kycResponse,
      message:
        "Your documents are uploaded successfully. We are currently verifying your documents. Please wait for 24 hours.",
    });
  }

  /**
   * checking ach transfer
   */
  @Route({ path: "/test-api", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async testApi(ctx: any) {
    const { publicToken, accountId } = ctx.request.body;
    const jwtToken = ctx.request.primeTrustToken;
    if (!publicToken || !accountId) {
      return this.BadRequest(ctx, "Public Token or AccountId Doesn't Exists");
    }
    const userExists = await UserTable.findOne(
      { _id: ctx.request.user._id },
      { _id: 1 }
    );
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const parentDetails: any = await ParentChildTable.findOne(
      {
        userId: new ObjectId(userExists._id),
      },
      {
        _id: 1,
        firstChildId: 1,
        contactId: 1,
        teens: 1,
      }
    );
    if (!parentDetails) {
      return this.BadRequest(ctx, "User Details Not Found");
    }
    const accountIdDetails = parentDetails.teens.find(
      (x: any) => x.childId.toString() == parentDetails.firstChildId.toString()
    );
    if (!accountIdDetails) {
      return this.BadRequest(ctx, "Account Details Not Found");
    }
    /**
     * get public token exchange
     */
    const publicTokenExchange: any = await getPublicTokenExchange(publicToken);
    if (publicTokenExchange.status == 400) {
      return this.BadRequest(ctx, publicTokenExchange.message);
    }
    /**
     * create processor token
     */
    const processToken: any = await createProcessorToken(
      publicTokenExchange.data.access_token,
      accountId
    );
    if (processToken.status == 400) {
      return this.BadRequest(ctx, processToken.message);
    }
    await ParentChildTable.updateOne(
      { _id: parentDetails._id },
      {
        $set: {
          processorToken: processToken.data.processor_token,
        },
      }
    );
    /**
     * create fund transfer with fund transfer id in response
     */
    let contributionRequest = {
      type: "contributions",
      attributes: {
        "account-id": accountIdDetails.accountId,
        "contact-id": parentDetails.contactId,
        "funds-transfer-method": {
          "funds-transfer-type": "ach",
          "ach-check-type": "personal",
          "contact-id": parentDetails.contactId,
          "plaid-processor-token": processToken.data.processor_token,
        },
        amount: "50",
      },
    };
    console.log(contributionRequest, "contributionRequest");
    const contributions: any = await createContributions(
      jwtToken,
      contributionRequest
    );
    if (contributions.status == 400) {
      return this.BadRequest(ctx, contributions);
    }
    return this.Ok(ctx, contributions.data);
  }

  /**
   * checking wire transfer
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/test-api-wire", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async testApiForWire(ctx: any) {
    const jwtToken = ctx.request.primeTrustToken;
    const userExists = await UserTable.findOne(
      { _id: ctx.request.user._id },
      { _id: 1 }
    );
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const parentDetails: any = await ParentChildTable.findOne(
      {
        userId: new ObjectId(userExists._id),
      },
      {
        _id: 1,
        firstChildId: 1,
        contactId: 1,
        teens: 1,
      }
    );
    if (!parentDetails) {
      return this.BadRequest(ctx, "User Details Not Found");
    }
    const accountIdDetails = parentDetails.teens.find(
      (x: any) => x.childId.toString() == parentDetails.firstChildId.toString()
    );
    if (!accountIdDetails) {
      return this.BadRequest(ctx, "Account Details Not Found");
    }
    /**
     * create fund transfer with fund transfer id in response
     */
    let contributionRequest = {
      type: "contributions",
      attributes: {
        "account-id": accountIdDetails.accountId,
        "contact-id": parentDetails.contactId,
        "funds-transfer-type": "wire",
        amount: "50",
      },
    };
    console.log(contributionRequest, "contributionRequest");
    const contributions: any = await createContributions(
      jwtToken,
      contributionRequest
    );
    if (contributions.status == 400) {
      return this.BadRequest(ctx, contributions);
    }
    return this.Ok(ctx, contributions.data);
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
    middleware: [uploadProfilePicture.single("picture")],
  })
  @Auth()
  public async updateProfilePicture(ctx: any) {
    if (!ctx.request.file || !ctx.request.file.filename)
      return this.BadRequest(ctx, "Image is not selected.");
    await UserTable.updateOne(
      { _id: ctx.request.user._id },
      {
        $set: { profilePicture: ctx.request.file.filename },
      }
    );
    return this.Ok(ctx, { message: "Profile Picture updated successfully." });
  }

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
          _id: 0,
        },
      },
    ]).exec();
    if (teens.length == 0) return this.BadRequest(ctx, "No child found");
    teens = teens[0];
    return this.Ok(ctx, teens);
  }

  /**
   * @description This method is used to upload files
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/upload-proof-of-address",
    method: HttpMethod.POST,
    middleware: [uploadIdProof.single("proof_of_address")],
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
        path.join(__dirname, "../../../uploads", files.filename)
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
        fs.unlinkSync(path.join(__dirname, "../../../uploads", files.filename));
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
}

export default new UserController();
