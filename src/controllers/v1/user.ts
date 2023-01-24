import { UserDraftTable } from "../../model/userDraft";
import { ENOTIFICATIONSETTINGS } from "../../types/user";
import { json } from "co-body";
import fs from "fs";
import moment from "moment";
import { ObjectId } from "mongodb";
import path from "path";
import envData from "../../config/index";
import { Auth, PrimeTrustJWT } from "../../middleware";
import { NotifyUserTable, ParentChildTable, UserTable } from "../../model";
import {
  DeviceTokenService,
  userService,
  zohoCrmService,
} from "../../services/v1/index";
import { ESCREENSTATUS, EUSERSTATUS, EUserType, HttpMethod } from "../../types";
import {
  agreementPreviews,
  checkValidBase64String,
  createAccount,
  getLinkToken,
  kycDocumentChecks,
  Route,
  uploadFileS3,
  uploadFilesFetch,
  uploadIdProof,
  uploadImage,
} from "../../utility";
import {
  CMS_LINKS,
  NOTIFICATION,
  NOTIFICATION_KEYS,
  PARENT_SIGNUP_FUNNEL,
} from "../../utility/constants";
import { validation } from "../../validations/v1/apiValidation";
import { UserBanksTable } from "../../model/userBanks";
import { getAccounts } from "../../utility/plaid";
import BaseController from "../base";

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
   * @description This method is used to send agreement previews to user
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/agreement-preview", method: HttpMethod.POST })
  @PrimeTrustJWT()
  public async sendAgreementPreview(ctx: any) {
    const reqParam = ctx.request.body;
    const jwtToken = ctx.request.primeTrustToken;
    const fullName = reqParam.firstName + " " + reqParam.lastName;
    const data = await userService.getAgreementPreview(fullName);
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
          screenStatus: ESCREENSTATUS.ADD_BANK_ACCOUNT,
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
    if (data) {
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

    data = {
      ...data,
      terms: CMS_LINKS.TERMS,
      amcPolicy: CMS_LINKS.AMC_POLICY,
      privacy: CMS_LINKS.PRIVACY_POLICY,
      ptUserAgreement: CMS_LINKS.PRIME_TRUST_USER_AGREEMENT,
    };

    return this.Ok(ctx, userDraft ? userDraft._doc : data, true);
  }

  /**
   * @description This method is used to get the bank account info
   * @param ctx
   * @returns
   */
  @Route({ path: "/get-bank-info", method: HttpMethod.GET })
  @Auth()
  public async getBankInfo(ctx: any) {
    const user = ctx.request.user;
    let array = [];
    let account;
    const getUserType = await UserTable.findOne({
      _id: ctx.request.user._id,
    });
    if (!getUserType) {
      return this.BadRequest(ctx, "User Not Found");
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
      for await (let userBank of userBankExists) {
        account = await getAccounts(userBank.accessToken);
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
   * @description This method is used to get the bank account info
   * @param ctx
   * @returns
   */
  @Route({ path: "/get-next-deposit-date/:userId", method: HttpMethod.GET })
  @Auth()
  public async getNextDepositDate(ctx: any) {
    const { userId } = ctx.request.params;
    return validation.nextDepositDateValidation(
      ctx.request.params,
      ctx,
      async (validate) => {
        if (validate) {
          const foundUser = await UserTable.findOne({
            _id: userId,
          });

          return this.Ok(ctx, {
            nextDepositDate: foundUser.selectedDepositDate
              ? moment(foundUser.selectedDepositDate).format("DD/MM/YYYY")
              : null,
          });
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
    middleware: [uploadFileS3.single("profile_picture")],
  })
  @Auth()
  public async updateProfilePicture(ctx: any) {
    console.log(ctx.request.body);
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
    await UserTable.updateOne(
      { _id: userExists._id },
      {
        $set: { profilePicture: imageName },
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
    let teens = await userService.getChildren(ctx.request.user._id);
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
        fs.unlinkSync(path.join(__dirname, "../../../uploads", files.filename));
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
    const accountIdDetails: any =
      userExists.type == EUserType.SELF
        ? parentChildExists
        : await parentChildExists.teens.find(
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
    const checkUserExists = await UserTable.findOne({ _id: user._id });
    if (!checkUserExists) {
      return this.BadRequest(ctx, "User does not exist");
    }
    return validation.toggleNotificationValidation(
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
            { new: true }
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
    const checkUserExists = await UserTable.findOne({
      _id: user._id,
    });
    const checkUserDraftExists = await UserDraftTable.findOne({
      _id: user._id,
    });
    if (!checkUserExists && !checkUserDraftExists) {
      return this.BadRequest(ctx, "User does not exist");
    }
    return validation.addDeviceTokenValidation(
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
    const checkUserExists = await UserTable.findOne({
      _id: user._id,
    });
    const checkUserDraftExists = await UserDraftTable.findOne({
      _id: user._id,
    });
    if (!checkUserExists && !checkUserDraftExists) {
      return this.BadRequest(ctx, "User does not exist");
    }
    return validation.removeDeviceTokenValidation(
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
}

export default new UserController();
