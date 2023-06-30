import envData from "@app/config/index";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import {
  ParentChildTable,
  TransactionTable,
  UserBanksTable,
  UserDraftTable,
  UserTable,
} from "@app/model";
import {
  DeviceTokenService,
  userService,
  zohoCrmService,
} from "@app/services/v1/index";
import { UserService } from "@app/services/v2";
import {
  ENOTIFICATIONSETTINGS,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
} from "@app/types";
import {
  checkValidBase64String,
  CMS_LINKS,
  createAccount,
  getAccounts,
  kycDocumentChecks,
  NOTIFICATION,
  NOTIFICATION_KEYS,
  PARENT_SIGNUP_FUNNEL,
  PLAID_ITEM_ERROR,
  Route,
  uploadFilesFetch,
  uploadImage,
} from "@app/utility";
import { validations } from "@app/validations/v2/apiValidation";
import { json } from "co-body";
import fs from "fs";
import moment from "moment";
import path from "path";
import BaseController from "@app/controllers/base";

class UserController extends BaseController {
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
      if (!fs.existsSync(path.join(__dirname, "../../../uploads"))) {
        fs.mkdirSync(path.join(__dirname, "../../../uploads"));
      }
      fs.writeFileSync(
        path.join(__dirname, "../../../uploads", imageName),
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
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/get-profile/:id", method: HttpMethod.GET })
  @Auth()
  public async getProfile(ctx: any) {
    const { id } = ctx.request.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id))
      return this.BadRequest(ctx, "Enter valid ID.");
    let { data, userDraft } = await UserService.getProfile(id);

    const checkIntitalDepositDone = await TransactionTable.findOne({
      $or: [{ parentId: id }, { userId: id }],
      intialDeposit: true,
    });

    if (data) {
      if (checkIntitalDepositDone) {
        data.initialDeposit = 1;
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

    if (checkIntitalDepositDone && userDraft) {
      userDraft.initialDeposit = 1;
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

  /**
   * @description This method is used to get child of parent
   * @param ctx
   * @returns
   */
  @Route({ path: "/get-children", method: HttpMethod.POST })
  @Auth()
  public async getChildren(ctx: any) {
    const checkUserExists = await UserTable.findOne({
      _id: ctx.request.user._id,
    });
    let teens = await userService.getChildren(
      checkUserExists ? ctx.request.user._id : ctx.request.body.userId
    );
    return this.Ok(ctx, teens);
  }

  /**
   * @description This method is used to get the bank account info
   * @param ctx
   * @returns
   */
  @Route({ path: "/get-bank-info", method: HttpMethod.POST })
  @Auth()
  public async getBankInfo(ctx: any) {
    const user = ctx.request.user;
    let array = [];
    let account;
    let getUserType = await UserTable.findOne({
      _id: ctx.request.user._id,
    });

    if (!getUserType) {
      getUserType = await UserTable.findOne({
        _id: ctx.request.body.userId,
      });
    }
    let parentId;
    if (getUserType.type == EUserType.TEEN) {
      parentId = await UserTable.findOne({
        email: getUserType.parentEmail,
      });
    }
    const userBankExists = await UserBanksTable.find({
      $or: [
        { userId: parentId ? parentId : user._id },
        {
          parentId: parentId ? parentId : user._id,
        },
      ],
    });
    if (userBankExists) {
      for (let userBank of userBankExists) {
        account = await getAccounts(userBank.accessToken);
        if (account.status == 400) {
          return this.BadRequest(
            ctx,
            account.error_code !== PLAID_ITEM_ERROR
              ? account.messsage
              : PLAID_ITEM_ERROR
          );
        }

        array.push({
          _id: userBank._id,
          accessToken: userBank.accessToken,
          isDefault: userBank.isDefault,
          accounts: account.data &&
            account?.data?.accounts[0] && [
              {
                bankId: account.data.accounts[0].account_id,
                bankAccountNo: account.data.accounts[0].mask,
                bankName: account.data.accounts[0].name,
              },
            ],
        });
      }
      return this.Ok(ctx, { data: array });
    } else {
      this.BadRequest(ctx, "No bank account added.");
    }
  }

  /**
   * @description This method is used to add/remove device token
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/device-token", method: HttpMethod.POST })
  @Auth()
  public async addDeviceToken(ctx: any) {
    const user = ctx.request.user;
    let reqParam = ctx.request.body;
    let checkUserExists = await UserTable.findOne({
      _id: user._id,
    });

    if (!checkUserExists) {
      checkUserExists = await UserTable.findOne({
        _id: reqParam.userId,
      });
    }
    let checkUserDraftExists = await UserDraftTable.findOne({
      _id: user._id,
    });

    if (!checkUserDraftExists) {
      checkUserDraftExists = await UserDraftTable.findOne({
        _id: reqParam.userId,
      });
    }
    if (!checkUserExists && !checkUserDraftExists) {
      return this.BadRequest(ctx, "User does not exist");
    }
    return validations.addDeviceTokenValidation(
      ctx.request.body,
      ctx,
      async (validate) => {
        if (validate) {
          await DeviceTokenService.addDeviceTokenIfNeeded(
            checkUserExists ? checkUserExists._id : checkUserDraftExists._id,
            reqParam.deviceToken
          );
          return this.Ok(ctx, { message: "Device token added successfully" });
        }
      }
    );
  }

  /**
   * @description This method is used to add/remove device token
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/device-token", method: HttpMethod.DELETE })
  @Auth()
  public async removeDeviceToken(ctx: any) {
    const user = ctx.request.user;
    let reqParam = ctx.request.body;
    let checkUserExists = await UserTable.findOne({
      _id: user._id,
    });

    if (!checkUserExists) {
      checkUserExists = await UserTable.findOne({
        _id: reqParam.userId,
      });
    }
    let checkUserDraftExists = await UserDraftTable.findOne({
      _id: user._id,
    });

    if (!checkUserDraftExists) {
      checkUserDraftExists = await UserDraftTable.findOne({
        _id: reqParam.userId,
      });
    }
    if (!checkUserExists && !checkUserDraftExists) {
      return this.BadRequest(ctx, "User does not exist");
    }
    return validations.removeDeviceTokenValidation(
      ctx.request.body,
      ctx,
      async (validate) => {
        if (validate) {
          await DeviceTokenService.removeDeviceToken(
            checkUserExists ? checkUserExists._id : checkUserDraftExists._id,
            reqParam.deviceToken
          );
          return this.Ok(ctx, { message: "Device token removed successfully" });
        }
      }
    );
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
    return validations.updateDobValidation(input, ctx, async (validate) => {
      if (validate) {
        if (
          (
            await UserTable.findOne(
              { _id: input.userId ? input.userId : ctx.request.user._id },
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
    await UserTable.updateOne(
      { _id: ctx.request.user._id },
      {
        $set: { profilePicture: imageName },
      }
    );
    return this.Ok(ctx, { message: "Profile Picture updated successfully." });
  }

  /**
   * @description This method is used for turing on/off notification
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/toggle-notification", method: HttpMethod.POST })
  @Auth()
  public async toggleNotificationSettings(ctx: any) {
    const user = ctx.request.user;
    let reqParam = ctx.request.body;
    const checkUserExists = await UserTable.findOne({
      _id: reqParam.userId ? reqParam.userId : user._id,
    });
    if (!checkUserExists) {
      return this.BadRequest(ctx, "User does not exist");
    }
    return validations.toggleNotificationValidation(
      ctx.request.body,
      ctx,
      async (validate) => {
        if (validate) {
          await UserTable.findByIdAndUpdate(
            { _id: checkUserExists._id },
            {
              $set: {
                isNotificationOn: reqParam.isNotificationOn,
              },
            },
            { new: true, upsert: true }
          );

          let message =
            reqParam.isNotificationOn == ENOTIFICATIONSETTINGS.ON
              ? "Turned on notification"
              : "Turned off notfication";

          return this.Ok(ctx, { message });
        }
      }
    );
  }
}

export default new UserController();
