import { ParentChildTable, UserDraftTable, UserTable } from "../model";
import { ObjectId } from "mongodb";
import moment from "moment";
import { ERECURRING } from "../types";

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
            lifeTimeReferralCount: "$lifeTimeReferral.referralCount",
            screenStatus: 1,
            city: 1,
            postalCode: 1,
            unitApt: 1,
            liquidAsset: 1,
            taxIdNo: 1,
            accessToken: "$parentchild.accessToken",
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
   * @description This method is used to create notification
   */
  public sendNotificationAction() {}
}

export default new UserService();
