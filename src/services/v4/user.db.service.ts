import {
  deleteAccountInformationInZoho,
  searchAccountInfoByEmail,
  updateAccountToPendingClosure,
  uploadFilesFetch,
  LIST,
  LEVELS,
  convertDateToTimeZone,
  getDaysBetweenDates,
  formattedDate,
} from "@app/utility/index";
import { NetworkError } from "@app/middleware/error.middleware";
import {
  UserTable,
  ParentChildTable,
  DripshopTable,
  LeagueTable,
  BusinessProfileTable,
} from "@app/model";
import fs from "fs";
import moment from "moment";
import path from "path";
import { EUSERSTATUS, EUserType } from "@app/types";
import { AuthService } from "@app/services/v1";
import { LeagueService } from "@app/services/v4";

class UserDBService {
  /**
   * @description get latest onboarded parents
   */
  public async getLatestOnBoardedParents() {
    const parents = await UserTable.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $match: {
          type: 2,
          status: 0,
          mobile: { $ne: null },
          referralCode: { $ne: null },
          isParentOnboardingReminderSent: false,
        },
      },
    ]).exec();
    return parents;
  }

  /**
   * @description get prime trust balance
   * @param emails
   */
  public async getUserDetails(emails) {
    const users = await UserTable.aggregate([
      {
        $match: {
          type: 1,
          email: { $in: emails },
        },
      },
      {
        $lookup: {
          from: "parentchild",
          localField: "_id",
          foreignField: "teens.childId",
          as: "teenUser",
        },
      },
      {
        $unwind: {
          path: "$teenUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          accountDetails: {
            $filter: {
              input: "$teenUser.teens",
              as: "list",
              cond: {
                $eq: ["$$list.childId", "$_id"],
              },
            },
          },
        },
      },
    ]).exec();
    if (users.length == 0) {
      throw new NetworkError("Users not found", 400);
    }
    return users;
  }

  /**
   * @description search zoho data and delete it
   * @param emails
   * @param zohoAccessToken
   */
  public async searchAndDeleteZohoAccounts(emails, zohoAccessToken) {
    const zohoCrmAccounts = await Promise.all(
      await emails.map(async (data: any) => {
        let crmAccount: any = await searchAccountInfoByEmail(
          zohoAccessToken,
          data
        );
        if (
          crmAccount.status == 200 &&
          crmAccount.data &&
          crmAccount.data.data.length > 0
        ) {
          await deleteAccountInformationInZoho(
            zohoAccessToken,
            crmAccount.data.data[0].id
          );
          return data;
        }
      })
    );
    return zohoCrmAccounts;
  }

  /**
   * @description search zoho data and delete it
   * @param token
   * @param accountIds
   */
  public async updatePTAccountsToPendingClosure(token, accountIds) {
    const pendingClosedAccounts = await Promise.all(
      await accountIds.map(async (data: any) => {
        let accountData = await updateAccountToPendingClosure(token, data);
        if (accountData.status == 200) {
          return accountIds;
        }
      })
    );
    return pendingClosedAccounts;
  }

  /*
   * @description Upload Proof of address, documents in prime trust
   * @param userExists
   * @param body
   */
  public async updatePrimeTrustMedia(userExists, body, jwtToken, filesArray) {
    /**
     * Validations to be done
     */
    const parentChildExists = await ParentChildTable.findOne({
      userId: userExists._id,
    });
    if (!parentChildExists) {
      throw new NetworkError("User Not Found", 400);
    }

    let existingStatus = (
      await UserTable.findOne({ _id: userExists._id }, { status: 1, _id: 0 })
    ).status;
    if (
      existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED ||
      existingStatus === EUSERSTATUS.KYC_DOCUMENT_UPLOAD
    ) {
      throw new NetworkError(
        existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED
          ? "User already verified."
          : "User's data already uploaded.",
        400
      );
    }

    let successResponse: any = {};

    // in case of proof of address file upload
    if (filesArray.address_proof) {
      const accountIdDetails: any =
        userExists.type === EUserType.SELF
          ? parentChildExists
          : await parentChildExists.teens.find(
              (x: any) =>
                x.childId.toString() ==
                parentChildExists.firstChildId.toString()
            );
      if (!accountIdDetails) {
        throw new NetworkError("Account Details Not Found", 400);
      }
      const fullName = userExists.firstName + " " + userExists.lastName;

      let addressDocumentId = null;
      let uploadFileError = null;
      let uploadData = {
        "contact-id": parentChildExists.contactId,
        description: "Proof of Address",
        label: "Proof of Address",
        public: "true",
        file: fs.createReadStream(
          path.join(
            __dirname,
            "../../../uploads",
            filesArray.address_proof[0].filename
          )
        ),
      };
      let uploadFile: any = await uploadFilesFetch(jwtToken, uploadData);
      if (uploadFile.status == 400) uploadFileError = uploadFile.message;
      if (uploadFile.status == 200 && uploadFile.message.errors != undefined)
        uploadFileError = uploadFile.message;
      if (uploadFileError) throw new NetworkError(uploadFileError, 400);

      addressDocumentId = uploadFile.message.data.id;
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
            proofOfAddressId: addressDocumentId,
          },
        }
      );
      successResponse.uploadAddressProofReponse = {
        message:
          "Your documents are uploaded successfully. We are currently verifying your documents. Please wait for 24 hours.",
      };
    }

    // in case of driving license file upload
    if (filesArray.id_proof_front && filesArray.id_proof_back) {
      let files = [...filesArray.id_proof_front, ...filesArray.id_proof_back];
      /**
       * Upload both file
       */
      let frontDocumentId = null;
      let backDocumentId = null;
      let uploadFileError = null;
      for await (let fileData of files) {
        let uploadData = {
          "contact-id": parentChildExists.contactId,
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
            path.join(__dirname, "../../../uploads", fileData.filename)
          ),
        };
        let uploadFile: any = await uploadFilesFetch(jwtToken, uploadData);
        if (uploadFile.status == 400) {
          uploadFileError = uploadFile.message;
          break;
        }
        if (
          uploadFile.status == 200 &&
          uploadFile.message.errors != undefined
        ) {
          uploadFileError = uploadFile.message;
          break;
        }
        fileData.fieldname == "id_proof_front"
          ? (frontDocumentId = uploadFile.message.data.id)
          : (backDocumentId = uploadFile.message.data.id);
      }
      if (uploadFileError) {
        throw new NetworkError(uploadFileError, 400);
      }

      await AuthService.updateKycDocumentChecks(
        parentChildExists,
        jwtToken,
        frontDocumentId,
        backDocumentId,
        userExists
      );
    }
  }

  /**
   * @description This method will return ranking of teens based on xpPoints
   * @param userIfExists
   * @param query
   * @returns {*}
   */
  public async getLeaderboards(userIfExists: any, query: any) {
    let leagueDetails = null;
    let userObject = null;
    let aggregateQuery: any = [
      {
        $setWindowFields: {
          sortBy: {
            xpPoints: -1,
          },
          output: {
            rank: {
              $documentNumber: {},
            },
            total: {
              $count: {},
            },
          },
        },
      },
      {
        $limit: query?.page ? LIST.limit * parseInt(query?.page) : 20,
      },
      {
        $project: {
          _id: 1,
          type: 1,
          firstName: 1,
          lastName: 1,
          rank: 1,
          xpPoints: 1,
          total: 1,
          profilePicture: 1,
          quizCoins: 1,
          preLoadedCoins: 1,
          activeStreak: "$streak.current",
        },
      },
    ];
    if (query?.league && userIfExists.xpPoints > 0) {
      leagueDetails = await LeagueTable.findOne({
        _id: query.league,
      }).select("_id name image colorCode minPoint maxPoint");
      if (!leagueDetails) {
        throw new NetworkError("Leagues Found", 400);
      }
      aggregateQuery.unshift({
        $match: {
          xpPoints: {
            $lte: leagueDetails.maxPoint,
            $gte: leagueDetails.minPoint,
          },
        },
      });
      if (query?.page) {
        const offset = (parseInt(query.page) - 1) * LIST.limit;
        aggregateQuery.push({ $skip: offset });
        const userDetails = await UserTable.aggregate([
          {
            $match: {
              xpPoints: {
                $lte: leagueDetails.maxPoint,
                $gte: leagueDetails.minPoint,
              },
            },
          },
          {
            $setWindowFields: {
              sortBy: {
                xpPoints: -1,
              },
              output: {
                rank: {
                  $documentNumber: {},
                },
              },
            },
          },
          {
            $match: {
              _id: userIfExists._id,
            },
          },
          {
            $addFields: {
              leagueDetails: null,
            },
          },
          {
            $project: {
              _id: 1,
              firstName: 1,
              rank: 1,
              xpPoints: 1,
              profilePicture: 1,
            },
          },
        ]).exec();
        userObject = userDetails.length > 0 ? userDetails[0] : null;
      }
    }
    let leaderBoardData: any = await UserTable.aggregate(aggregateQuery).exec();
    if (!userObject) {
      const userExistsInLeaderBoard =
        leaderBoardData?.find(
          (x) => x._id.toString() === userIfExists._id.toString()
        ) || null;
      userObject = {
        _id: userIfExists._id,
        rank: userExistsInLeaderBoard ? userExistsInLeaderBoard.rank : 21,
        leagueDetails: null,
        xpPoints: userIfExists.xpPoints,
        firstName: userIfExists.firstName,
        profilePicture: userIfExists.profilePicture,
      };
    }
    if (leagueDetails) {
      userObject = { ...userObject, leagueDetails };
    }
    return {
      leaderBoardData,
      userObject,
      totalRecords: leaderBoardData.length > 0 ? leaderBoardData[0].total : 0,
    };
  }

  /**
   * @description This service is used to update the fuels of user
   * @param userExists
   * @param dripshopData
   * @param fuel
   */
  public async redeemDripShop(userExists: any, dripshopData: any, body: any) {
    const { fuel } = dripshopData;
    let totalChildFuels = userExists.preLoadedCoins + userExists.quizCoins;

    let updatedCoinQuery: any = {};

    if (totalChildFuels >= fuel) {
      /**
       * once true check what to update preloaded or quiz coins or both
       */
      if (userExists.preLoadedCoins >= fuel) {
        updatedCoinQuery = {
          ...updatedCoinQuery,
          $set: {
            preLoadedCoins: userExists.preLoadedCoins - fuel,
          },
        };
      } else {
        /**
         * amountLeftAfterPreloaded - contains amount left after removal of preloaded coins from required fuels
         */
        let amountLeftAfterPreloaded = fuel - userExists.preLoadedCoins;

        if (amountLeftAfterPreloaded <= userExists.quizCoins) {
          updatedCoinQuery = {
            ...updatedCoinQuery,
            $set: {
              preLoadedCoins: 0,
              quizCoins: userExists.quizCoins - amountLeftAfterPreloaded,
            },
          };
        }
      }
    } else {
      throw new NetworkError("Insufficient Fuels.", 400);
    }
    const createdDripshop = await DripshopTable.create({
      firstName: body.firstName,
      lastName: body.lastName,
      redeemedFuels: fuel,
      userId: userExists._id,
      itemId: dripshopData._id,
      address: body.address,
      state: body.state,
      city: body.city,
      apartment: body.apartment || null,
      zipCode: body.zipCode,
      selectedSize: body.selectedSize || null,
    });
    const updatedUser = await UserTable.findOneAndUpdate(
      {
        _id: userExists._id,
      },
      updatedCoinQuery,
      { new: true }
    );

    return { createdDripshop, updatedUser };
  }

  /**
   * @description This method is used to add streaks
   * @param userDetails
   * @returns {*}
   */
  public async addStreaks(userDetails: any) {
    try {
      let showStreakScreen = false;
      /**
       * Check if streak is inactive since last 5 days
       */
      const isStreakInActiveSinceLast5Days =
        userDetails?.streak?.last5days?.every((value) => value === null) ||
        false;
      const reset5daysStreak = [1, null, null, null, null];
      let streak = {};
      const currentDate = convertDateToTimeZone(
        new Date(),
        userDetails.timezone
      );
      const previousStreak = userDetails.streak.current;
      const isFirstStreak =
        !userDetails || userDetails?.streak?.updatedDate?.day === 0;
      const { year, month, day } = userDetails.streak.updatedDate;
      const startDate = formattedDate(year, month, day);
      const endDate = new Date(currentDate.date);
      const difference = getDaysBetweenDates(startDate, endDate);
      if (isFirstStreak || (!isFirstStreak && difference === 1)) {
        let last5days: any = [];
        const earliestNullIndex =
          userDetails?.streak?.last5days?.indexOf(null) ?? -1;
        if (earliestNullIndex === -1) {
          last5days = reset5daysStreak;
        } else {
          userDetails.streak.last5days[earliestNullIndex] = 1;
          last5days = userDetails.streak.last5days;
        }
        streak = {
          ...streak,
          current: userDetails?.streak?.current + 1,
          longest:
            userDetails?.streak?.longest < userDetails?.streak?.current + 1
              ? userDetails?.streak?.current + 1
              : userDetails?.streak?.longest,
          updatedDate: {
            day: currentDate.day,
            month: currentDate.month,
            year: currentDate.year,
          },
          last5days,
        };
        showStreakScreen = true;
      } else if (difference > 1) {
        const last5days = this.modifyLast5DaysStreaks(
          difference,
          userDetails.streak.last5days,
          reset5daysStreak
        );

        streak = {
          ...streak,
          current: 1,
          longest: userDetails.streak.longest,
          updatedDate: {
            day: currentDate.day,
            month: currentDate.month,
            year: currentDate.year,
          },
          last5days,
        };
        showStreakScreen = true;
      }
      if (showStreakScreen) {
        let isStreakGoalAchieved = false;
        const updatedStreaksDetails = await UserTable.findOneAndUpdate(
          { _id: userDetails._id },
          {
            $set: {
              streak: streak,
            },
          },
          { upsert: true, new: true }
        );
        const dayRange = this.get5DaysOfWeek(
          updatedStreaksDetails.streak.updatedDate,
          updatedStreaksDetails.streak.last5days
        );
        /**
         * Check if streak goal is completed or not
         */
        const businessProfile: any = await BusinessProfileTable.findOne({
          userId: userDetails._id,
        }).populate("streakGoal");
        if (
          (businessProfile?.streakGoal &&
            updatedStreaksDetails.streak.current ==
              businessProfile?.streakGoal?.day) ||
          isStreakInActiveSinceLast5Days
        ) {
          isStreakGoalAchieved = isStreakInActiveSinceLast5Days ? false : true;
          await BusinessProfileTable.findOneAndUpdate(
            {
              userId: userDetails._id,
            },
            {
              $set: {
                streakGoal: null,
              },
            }
          );
        }
        return {
          showStreakScreen,
          last5DaysStreak: updatedStreaksDetails.streak.last5days,
          last5DaysWeek: dayRange,
          currentStreak: updatedStreaksDetails.streak.current,
          previousStreak: previousStreak,
          isStreakGoalAchieved,
          isStreakInActiveSinceLast5Days,
        };
      }

      /**
       * Give last5days streak and last5days of week
       */
      return {
        showStreakScreen,
      };
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This method is used to modify the last 5 days array based on certain conditions
   * @param difference
   * @param last5days
   * @param reset5daysStreak
   * @return {*}
   */
  public modifyLast5DaysStreaks(
    difference: number,
    last5days: any,
    reset5daysStreak: any,
    isStreakAdded: boolean = true
  ) {
    let dayStreaks: any = [];
    const nullCount = last5days.filter((item) => item === null).length;
    if (difference > nullCount) {
      dayStreaks = reset5daysStreak;
    } else {
      for (let i = 0; i < last5days.length; i++) {
        if (last5days[i] === null) {
          if (i <= difference - 1) {
            last5days[i] = 0;
          } else if (i === difference && isStreakAdded) {
            last5days[i] = 1;
          }
        }
      }
      dayStreaks = last5days;
    }
    return dayStreaks;
  }

  /**
   * @description This method is used to get5DaysOfWeek and give day range
   * @param date
   * @param last5days
   * @return {*}
   */
  public get5DaysOfWeek(date: any, last5days: any) {
    let dayRange = [];
    const notNullLast5DaysCount = last5days.filter((x) => x !== null).length;
    let updatedDate: any = formattedDate(date.year, date.month, date.day);
    notNullLast5DaysCount === 0
      ? updatedDate
      : updatedDate.setDate(updatedDate.getDate() - notNullLast5DaysCount + 1);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    for (let i = 0; i < 5; i++) {
      const dayIndex = updatedDate.getDay();
      const dayName = daysOfWeek[dayIndex];
      dayRange.push(dayName.charAt(0));
      updatedDate.setDate(updatedDate.getDate() + 1);
    }
    return dayRange;
  }
}

export default new UserDBService();
