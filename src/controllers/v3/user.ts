import fs from "fs";
import moment from "moment";
import path from "path";
import envData from "@app/config/index";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import {
  AdminTable,
  CryptoTable,
  ParentChildTable,
  TransactionTable,
  UserBanksTable,
  UserTable,
} from "@app/model";
import { DeviceTokenService, zohoCrmService } from "@app/services/v1";
import { TransactionDBService, UserService } from "@app/services/v3";
import { TradingService } from "@app/services/v3/index";
import userService from "@app/services/v3/user.service";
import {
  ETransactionStatus,
  ETransactionType,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
} from "@app/types";
import {
  createAccount,
  kycDocumentChecks,
  removeImage,
  Route,
  uploadFileS3,
  uploadFilesFetch,
  uploadIdProof,
  CMS_LINKS,
  NOTIFICATION,
  NOTIFICATION_KEYS,
  PARENT_SIGNUP_FUNNEL,
} from "@app/utility";
import BaseController from "@app/controllers/base";

class UserController extends BaseController {
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
    let { data } = await UserService.getProfile(id);

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

    data = {
      ...data,
      terms: CMS_LINKS.TERMS,
      amcPolicy: CMS_LINKS.AMC_POLICY,
      privacy: CMS_LINKS.PRIVACY_POLICY,
      ptUserAgreement: CMS_LINKS.PRIME_TRUST_USER_AGREEMENT,
    };

    return this.Ok(ctx, data, true);
  }

  /**
   * @description This method is start reward time , make intial transaction and set isGiftedCrypto to 1
   * @param ctx
   */
  @Route({ path: "/start-reward-timer", method: HttpMethod.POST })
  @Auth()
  public async startRewardTimer(ctx: any) {
    try {
      const user = ctx.request.user;
      const admin = await AdminTable.findOne({});
      let userExists = await UserTable.findOne({ _id: user._id });
      if (!userExists) {
        userExists = await UserTable.findOne({ _id: ctx.request.body.userId });
      }
      if (!userExists || (userExists && userExists.type !== EUserType.TEEN)) {
        return this.BadRequest(ctx, "User Not Found");
      }
      if (userExists.unlockRewardTime) {
        return this.BadRequest(ctx, "You already unlocked the reward");
      }
      let transactionExists = await TransactionTable.findOne({
        userId: userExists._id,
        type: ETransactionType.BUY,
        status: ETransactionStatus.GIFTED,
      });
      if (
        admin.giftCryptoSetting == 1 &&
        userExists.isGiftedCrypto == 0 &&
        !transactionExists
      ) {
        let crypto = await CryptoTable.findOne({ symbol: "BTC" });
        await TransactionDBService.createBtcGiftedTransaction(
          userExists._id,
          crypto,
          admin
        );
      } else if (transactionExists) {
        await UserTable.findOneAndUpdate(
          { _id: userExists._id },
          {
            $set: {
              unlockRewardTime: moment().add(admin.rewardHours, "hours").unix(),
              isGiftedCrypto: 1,
            },
          }
        );
      }
      const userData = await UserTable.findOne({ _id: userExists._id });
      return this.Ok(ctx, {
        message: "Reward Unlocked Successfully",
        data: { rewardHours: userData.unlockRewardTime },
      });
    } catch (error) {
      return this.BadRequest(ctx, "Something went wrong");
    }
  }

  /**
   * @description This method is used to reward crypto when parent is completed with kyc + bank details
   * @param ctx
   */
  @Route({ path: "/reward-crypto", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async rewardCrypto(ctx: any) {
    try {
      const reqParam = ctx.request.body;
      const jwtToken = ctx.request.primeTrustToken;
      const admin = await AdminTable.findOne({});
      let userExists = await UserTable.findOne({ _id: ctx.request.user._id });
      if (!userExists) {
        userExists = await UserTable.findOne({ _id: reqParam.userId });
        if (!userExists) {
          return this.BadRequest(ctx, "User Not Found");
        }
      }
      const parentChildDetails = await UserService.getParentChildInfo(
        userExists._id
      );
      const checkParentInfo =
        parentChildDetails &&
        (await UserTable.findOne({
          _id: parentChildDetails.userId,
        }));

      const checkParentBankExists =
        parentChildDetails &&
        (await UserBanksTable.findOne({
          $or: [
            { userId: parentChildDetails.userId },
            { parentId: parentChildDetails.userId },
          ],
        }));
      if (
        checkParentInfo &&
        checkParentInfo.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED &&
        checkParentBankExists &&
        admin.giftCryptoSetting == 1 &&
        userExists.isGiftedCrypto !== 2
      ) {
        const accountIdDetails = await parentChildDetails.teens.find(
          (x: any) => x.childId.toString() == userExists._id.toString()
        ).accountId;

        if (parentChildDetails && userExists.isRewardDeclined == false) {
          await TradingService.internalTransfer(
            parentChildDetails,
            jwtToken,
            accountIdDetails,
            userExists.type,
            admin,
            true
          );
        }
      }
      return this.Ok(ctx, { message: "Success" });
    } catch (error) {
      return this.BadRequest(ctx, "Something went wrong");
    }
  }

  /**
   * @description This method is used to decline the reward
   * @param ctx
   */
  @Route({ path: "/decline-reward", method: HttpMethod.POST })
  @Auth()
  public async declineReward(ctx: any) {
    try {
      const reqParam = ctx.request.body;
      let userExists = await UserTable.findOne({ _id: ctx.request.user._id });
      if (!userExists) {
        userExists = await UserTable.findOne({ _id: reqParam.userId });
        if (!userExists) {
          return this.BadRequest(ctx, "User Not Found");
        }
      }
      await UserTable.findOneAndUpdate(
        { userId: userExists._id },
        {
          $set: {
            isRewardDeclined: true,
          },
        }
      );
      await TransactionTable.deleteOne({
        userId: userExists._id,
        status: ETransactionStatus.GIFTED,
      });
      return this.Ok(ctx, { message: "Reward Declined Successfully" });
    } catch (error) {
      return this.BadRequest(ctx, "Something went wrong");
    }
  }

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
      const isDetailsDeleted = await userService.deleteUserData(
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
