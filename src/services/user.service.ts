import { referralArray } from "./../types/user-referral";
import { EUserType, EUSERSTATUS } from "./../types/user";
import {
  DeviceToken,
  Notification,
  ParentChildTable,
  UserDraftTable,
  UserReffaralTable,
  UserTable,
} from "../model";
import { ObjectId } from "mongodb";
import moment from "moment";
import { ERead, ERECURRING } from "../types";
import config from "../config/index";
import { NOTIFICATION, NOTIFICATION_KEYS } from "../utility/constants";
import { sendNotification } from "../utility/notificationSend";

class UserService {
  /**
   * @description Get Children Data
   * @param userId
   */
  public async getChildren(userId: string) {
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
          userId: new ObjectId(userId),
        },
      },
      {
        $project: {
          "teens.firstName": 1,
          "teens.lastName": 1,
          "teens.username": 1,
          "teens._id": 1,
          "teens.profilePicture": 1,
          "teens.isAutoApproval": 1,
          _id: 0,
        },
      },
    ]).exec();
    if (teens.length == 0) throw Error("No child found");
    return teens[0];
  }

  /**
   * @description Get Profile of users
   * @param userId
   */
  public async getProfile(userId: string) {
    let data = (
      await UserTable.aggregate([
        { $match: { _id: new ObjectId(userId) } },
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
          $lookup: {
            from: "parentchild",
            localField: "_id",
            foreignField: "userId",
            as: "parentchild",
          },
        },
        { $unwind: { path: "$parentchild", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "user-refferals",
            localField: "_id",
            foreignField: "userId",
            as: "lifeTimeReferral",
          },
        },
        {
          $unwind: {
            path: "$lifeTimeReferral",
            preserveNullAndEmptyArrays: true,
          },
        },
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
            lifeTimeReferralCount: {
              $ifNull: ["$lifeTimeReferral.referralCount", 0],
            },
            referralCode: 1,
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
            isRecurring: 1,
            selectedDeposit: 1,
            selectedDepositDate: 1,
          },
        },
      ]).exec()
    )[0];

    let userDraft: any = await UserDraftTable.findOne({
      _id: new ObjectId(userId),
    });

    if (!data && !userDraft) {
      throw Error("Invalid user ID entered.");
    }
    return { data, userDraft };
  }

  /**
   * @description Get Prime Trust Agreement Preview
   * @param fullName
   */
  public async getAgreementPreview(fullName: string) {
    const data = {
      type: "agreement-previews",
      attributes: {
        "account-type": "custodial",
        name: fullName + " child-1",
        "authorized-signature": " ",
        owner: {
          "contact-type": "natural_person",
          name: fullName,
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
    return data;
  }

  /**
   * @description Get Scheduled Date
   * @param isRecurring
   */
  public getScheduleDate(isRecurring: any) {
    let scheduleDate = moment()
      .startOf("day")
      .add(
        isRecurring == ERECURRING.WEEKLY
          ? 7
          : isRecurring == ERECURRING.MONTLY
          ? 1
          : isRecurring == ERECURRING.DAILY
          ? 24
          : 0,
        isRecurring == ERECURRING.WEEKLY
          ? "days"
          : isRecurring == ERECURRING.MONTLY
          ? "months"
          : isRecurring == ERECURRING.DAILY
          ? "hours"
          : "day"
      )
      .format("YYYY-MM-DD");
    return scheduleDate;
  }

  /**
   * @description get whether kyc approved or not
   * @param email
   */
  public async getKycApproved(email: string) {
    /**
     * get the type, status and parentEmail
     */
    let checkKyc: any = await UserTable.findOne(
      { email: email },
      { type: 1, status: 1, parentEmail: 1 }
    );

    /**
     * if type if child look for parent and check status === 3
     */
    if (checkKyc.type === EUserType.TEEN) {
      let checkParentExists = await UserTable.findOne(
        { email: checkKyc.parentEmail },
        { status: 1 }
      );
      if (checkParentExists.status === EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
        return {
          status: true,
          userId: checkParentExists._id,
          childId: checkKyc._id,
          type: checkKyc.type,
        };
      }
    }

    /**
     * if type is parent give the giftcard to first child
     */
    if (checkKyc.type === EUserType.PARENT) {
      let getFirstChild = await ParentChildTable.findOne(
        {
          userId: checkKyc._id,
        },
        { firstChildId: 1, _id: 0 }
      );
      if (checkKyc.status === EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
        return {
          status: true,
          userId: checkKyc._id,
          childId: getFirstChild.firstChildId,
          type: checkKyc.type,
        };
      }
    }

    /**
     * if the type is self directly check the status === 3
     */
    if (
      checkKyc.status === EUSERSTATUS.KYC_DOCUMENT_VERIFIED &&
      checkKyc.type === EUserType.SELF
    ) {
      return {
        status: true,
        userId: checkKyc._id,
        childId: checkKyc._id,
        type: checkKyc.type,
      };
    }
    return {
      status: false,
      userId: checkKyc._id,
      childId: checkKyc._id,
      type: checkKyc.type,
    };
  }

  /**
   * @description to get the referral amount
   * @param userId
   * @param userReferral
   */
  public async getUserReferral(userId: string, userReferral: string) {
    let referralCoins = 0;
    let userUpdateReferrals = [];
    let getReferralCode;
    if (userReferral) {
      getReferralCode = await UserReffaralTable.aggregate([
        {
          $match: {
            userId: userId,
          },
        },
        {
          $lookup: {
            from: "devicetokens",
            localField: "userId",
            foreignField: "userId",
            as: "deviceTokenInfo",
          },
        },
        {
          $unwind: {
            path: "$deviceTokenInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "devicetokens",
            localField: "referralArray.referredId",
            foreignField: "userId",
            as: "recieverDeviceTokenInfo",
          },
        },
        {
          $unwind: {
            path: "$recieverDeviceTokenInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            userId: {
              $first: "$userId",
            },
            senderName: {
              $first: "$senderName",
            },
            referralCount: {
              $first: "$referralCount",
            },
            referralArray: {
              $first: "$referralArray",
            },
            deviceTokenInfo: {
              $first: "$deviceTokenInfo",
            },
            recieverDeviceTokenInfo: {
              $push: "$recieverDeviceTokenInfo",
            },
          },
        },
      ]).exec();

      console.log("getReferralCode: ", getReferralCode[0]);

      if (getReferralCode) {
        referralCoins = referralCoins + parseInt(config.APP_REFERRAL_COINS);
        await getReferralCode[0].referralArray.map((obj) => {
          if (!userUpdateReferrals.includes(obj.referredId)) {
            return userUpdateReferrals.push(obj.referredId);
          }
        });
        userUpdateReferrals.push(userId);
        console.log("referralCoins :>> ", referralCoins);
        console.log("userUpdateReferrals: ", userUpdateReferrals);
      }
    }

    await UserTable.updateMany(
      {
        _id: { $in: userUpdateReferrals },
      },
      {
        $inc: {
          preLoadedCoins: referralCoins,
        },
      }
    );

    for await (let receiver of getReferralCode[0].referralArray) {
      await this.sendNotificationService(
        userId,
        getReferralCode[0].deviceTokenInfo.deviceToken[0],
        NOTIFICATION.REFERRAL_SENDER_MESSAGE,
        receiver.receiverName
      );
      console.log(
        "getReferralCode[0] ",
        getReferralCode[0].recieverDeviceTokenInfo
      );
      for await (let deviceToken of getReferralCode[0]
        .recieverDeviceTokenInfo) {
        console.log("here");
        if (receiver.referredId.toString() == deviceToken.userId.toString()) {
          await this.sendNotificationService(
            receiver.referredId,
            deviceToken.deviceToken[0],
            NOTIFICATION.REFERRAL_RECEIVER_MESSAGE,
            getReferralCode[0].senderName
          );
        }
      }
    }
    return true;
  }

  /**
   * send notification service
   */

  public async sendNotificationService(
    userId: string,
    deviceToken: any,
    key: any,
    name: any
  ) {
    let notificationRequest = {
      key: NOTIFICATION_KEYS.FREIND_REFER,
      title: NOTIFICATION.REFERR_TITLE,
      message: key.replace("{friendName}", name),
    };
    await sendNotification(
      deviceToken,
      notificationRequest.title,
      notificationRequest
    );

    await Notification.create({
      title: notificationRequest.title,
      userId: userId,
      message: notificationRequest.message,
      isRead: ERead.UNREAD,
      data: JSON.stringify(notificationRequest),
    });

    return true;
  }
}

export default new UserService();
