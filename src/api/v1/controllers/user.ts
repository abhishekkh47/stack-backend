import Koa from "koa";
import BaseController from "./base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import { validation } from "@app/validations/apiValidation";
import { ParentChildTable, UserTable } from "@app/model";
import fs from "fs";
import {
  agreementPreviews,
  checkValidImageExtension,
  createAccount,
  createProcessorToken,
  getPublicTokenExchange,
  createFundTransferMethod,
  kycDocumentChecks,
  Route,
  uploadFilesFetch,
  createContributions,
  getLinkToken,
} from "@app/utility";
import { HttpMethod } from "@app/types";
import multer from "@koa/multer";
import path from "path";
import moment from "moment";
import { ObjectId } from "mongodb";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../../uploads"));
  },
  filename: function (req, file, cb) {
    let type = file.originalname.split(".")[1];
    cb(null, `${file.fieldname}-${Date.now().toString(16)}.${type}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5000000, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (!checkValidImageExtension(file)) {
      return cb(
        new Error(
          "Please upload a Image of valid extension of jpg or pdf format only."
        )
      );
    }
    cb(null, true);
  },
});

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
      ["name"]
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
            region: userExists.stateId.name,
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
      return this.BadRequest(ctx, sendAgreementPreview);
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
      upload.fields([
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
      ["name"]
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
          url: "https://eoo8gzhyo65jjji.m.pipedream.net",
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
            region: userExists.stateId.name,
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
      return this.BadRequest(ctx, kycResponse);
    }
    if (kycResponse.status == 200 && kycResponse.data.errors != undefined) {
      return this.BadRequest(ctx, kycResponse);
    }
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
  @Route({ path: "/get-profile", method: HttpMethod.GET })
  @Auth()
  public async getProfile(ctx: any) {
    let data = (
      await UserTable.aggregate([
        { $match: { _id: new ObjectId(ctx.request.user._id) } },
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
            "state.name": 1,
            "state._id": 1,
            city: 1,
            postalCode: 1,
            unitApt: 1,
            liquidAsset: 1,
            taxIdNo: 1,
            taxState: 1,
            dob: 1,
          },
        },
      ]).exec()
    )[0];
    return this.Ok(ctx, data, true);
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
}

export default new UserController();
