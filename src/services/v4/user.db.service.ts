import {
  deleteAccountInformationInZoho,
  searchAccountInfoByEmail,
  updateAccountToPendingClosure,
  uploadFilesFetch,
  LIST,
  FIVE_DAYS_TO_RESET,
  convertDateToTimeZone,
  getDaysBetweenDates,
  formattedDate,
  DEFAULT_LIFE_COUNT,
  STREAK_LEVELS,
  REFILL_INTERVAL,
  MAX_STREAK_FREEZE,
  STREAK_FREEZE_FUEL,
  REFILL_LIFE_FUEL,
} from "@app/utility/index";
import { NetworkError } from "@app/middleware/error.middleware";
import {
  UserTable,
  ParentChildTable,
  DripshopTable,
  LeagueTable,
  SearchHistoryTable,
  StreakGoalTable,
} from "@app/model";
import fs from "fs";
import moment from "moment";
import path from "path";
import { EUSERSTATUS, EUserType, IMDY, IStreak } from "@app/types";
import { AuthService } from "@app/services/v1";
import { AnalyticsService, LeagueService } from "@app/services/v4";

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
   * @description This service is used to store users search input
   * @param userId
   * @param searchInput
   * @returns {boolean}
   */
  public async storeUsersSearchInput(userId: string, searchInput: string) {
    const userSearchInput = await SearchHistoryTable.find({ userId });
    const isSearchInputValid =
      userSearchInput.length === 0 ||
      !userSearchInput.some(
        (x) => x.searchInput.toLowerCase() === searchInput.toLowerCase()
      );
    if (isSearchInputValid) {
      await SearchHistoryTable.create({
        userId,
        searchInput: searchInput.toLowerCase(),
      });
      return true;
    }
    return false;
  }

  /**
   * @description This method is used to add streaks
   * @param userDetails
   * @returns {*}
   */
  public async addStreaks(userDetails: any) {
    try {
      let isStreakToBeUpdated = false;
      const {
        streak: { freezeCount: latestStreakFreezeCount },
      } = await UserTable.findOne({
        _id: userDetails._id,
      }).select("_id streak");
      let streakFreezeToConsume = 0;
      /**
       * Check if streak is inactive since last 5 days
       */
      const isStreakInActiveSinceLast5Days =
        userDetails?.streak?.last5days?.every((value) => value === 0) || false;
      let streak = {};
      const currentDate = convertDateToTimeZone(
        new Date(),
        userDetails.timezone
      );
      const currentStreak = userDetails.streak.current;
      const { day } = userDetails?.streak?.updatedDate;
      const isFirstStreak = !userDetails || day === 0;
      const diffDays = getDaysBetweenDates(
        userDetails?.streak?.updatedDate,
        currentDate
      );
      if (isFirstStreak || diffDays === 1) {
        let last5days: any = [];
        const earliestNullIndex =
          userDetails?.streak?.last5days?.indexOf(null) ?? -1;
        if (earliestNullIndex === -1) {
          last5days = FIVE_DAYS_TO_RESET;
        } else {
          last5days = userDetails.streak.last5days.map((value, index) =>
            index === earliestNullIndex ? 1 : value
          );
        }
        streak = {
          current: userDetails?.streak?.current + 1,
          longest: Math.max(
            userDetails?.streak?.current + 1,
            userDetails?.streak?.longest
          ),
          isStreakInactive5Days: false,
          updatedDate: currentDate,
          last5days,
          freezeCount: userDetails?.streak?.freezeCount || 0,
        };
        isStreakToBeUpdated = true;
      } else if (diffDays > 1) {
        let currentStreakValue = 1;
        let longestStreakValue = userDetails.streak.longest;
        if (latestStreakFreezeCount > 0) {
          streakFreezeToConsume =
            diffDays > MAX_STREAK_FREEZE ? latestStreakFreezeCount : 1;
          if (diffDays - streakFreezeToConsume <= 1) {
            currentStreakValue = userDetails.streak.current + 1;
            longestStreakValue = Math.max(
              currentStreakValue,
              userDetails?.streak?.longest
            );
          }
        }
        const { last5days, isStreakInactive5Days } =
          this.modifyLast5DaysStreaks(
            diffDays,
            userDetails.streak.last5days,
            FIVE_DAYS_TO_RESET,
            true,
            streakFreezeToConsume
          );
        streak = {
          current: currentStreakValue,
          longest: longestStreakValue,
          isStreakInactive5Days,
          updatedDate: currentDate as IMDY,
          last5days,
          freezeCount: latestStreakFreezeCount - streakFreezeToConsume,
        };
        isStreakToBeUpdated = true;
      }
      if (isStreakToBeUpdated) {
        const updatedStreaksDetails = await UserTable.findOneAndUpdate(
          { _id: userDetails._id },
          {
            $set: {
              streak,
            },
          },
          { upsert: true, new: true }
        );
        AnalyticsService.identifyStreak(userDetails._id, streak as IStreak);
        const dayRange = this.get5DaysOfWeek(
          updatedStreaksDetails.streak.updatedDate,
          updatedStreaksDetails.streak.last5days
        );
        /**
         * Check if streak goal is completed or not
         */
        if (
          (userDetails?.streakGoal &&
            updatedStreaksDetails.streak.current ==
              userDetails?.streakGoal?.day) ||
          updatedStreaksDetails.streak.isStreakInactive5Days
        ) {
          await UserTable.findOneAndUpdate(
            {
              _id: userDetails._id,
            },
            {
              $set: {
                streakGoal: null,
              },
            }
          );
        }
        return {
          last5DaysStreak: updatedStreaksDetails.streak.last5days,
          last5DaysWeek: dayRange,
          currentStreak: updatedStreaksDetails.streak.current,
          previousStreak: currentStreak,
          isStreakInActiveSinceLast5Days,
        };
      }
      return null;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This method is used to set streak goals
   * @param userId
   * @param streakGoalId
   * @returns {*}
   */
  public async setStreakGoal(userId: string, streakGoalId: string) {
    try {
      const streakGoalsIfExists = await StreakGoalTable.findOne({
        _id: streakGoalId,
      });
      if (!streakGoalsIfExists) {
        throw new NetworkError("No Streak Goal Found", 400);
      }
      await UserTable.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            streakGoal: streakGoalId,
            streakInActiveDays: false,
          },
        }
      );
      return streakGoalsIfExists;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This method is used to modify the last 5 days array based on certain conditions
   * @param diffDays
   * @param last5days
   * @param reset5daysStreak
   * @return {*}
   */
  public modifyLast5DaysStreaks(
    diffDays: number,
    last5days: any,
    reset5daysStreak: any,
    isStreakAdded: boolean = true,
    streakFreezeEquipped: number = 0
  ) {
    let streakFreezeCount = streakFreezeEquipped;
    let dayStreaks: any = [];
    let inactiveStreakCount = 0;
    const nullCount = last5days.filter((item) => item === null).length;
    if (diffDays > nullCount) {
      dayStreaks = reset5daysStreak;
      inactiveStreakCount = nullCount;
      const checkDiffDays = diffDays - nullCount;
      if (checkDiffDays < 6) {
        inactiveStreakCount += checkDiffDays - 1;
        dayStreaks = dayStreaks.fill(0, 0, checkDiffDays - 1);
        let zeroCount = 0;
        if (streakFreezeCount > 0) {
          streakFreezeCount = Math.abs(nullCount - streakFreezeCount);
          dayStreaks = dayStreaks.map((element) => {
            if (element === 0) {
              zeroCount++;
              if (zeroCount <= streakFreezeCount) {
                return MAX_STREAK_FREEZE;
              }
            }
            return element;
          });
        }
      }
    } else {
      let nullCount = 0;
      dayStreaks = last5days.map((value) => {
        if (value === null) {
          nullCount++;
          if (nullCount < diffDays) {
            if (streakFreezeCount > 0) {
              streakFreezeCount--;
              return MAX_STREAK_FREEZE;
            } else {
              return 0;
            }
          } else if (nullCount === diffDays && isStreakAdded) {
            return 1;
          }
        }
        return value;
      });
      inactiveStreakCount = this.findLastConsecutiveZeroes(dayStreaks);
    }
    return {
      last5days: dayStreaks,
      isStreakInactive5Days: inactiveStreakCount >= 5 ? true : false,
    };
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
    let updatedDate: any = new Date(
      formattedDate(date.year, date.month, date.day)
    );

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

  /**
   * @description This method isused to fetch users streak achievements
   * @param longestStreak
   * @returns {*}
   */
  public getUserStreaksAchievements(longestStreak: number = 0) {
    let achievements = {};
    if (longestStreak >= STREAK_LEVELS.LEVEL6.maxValue) {
      const additionalLevels =
        Math.floor((longestStreak - STREAK_LEVELS.LEVEL6.maxValue) / 50) + 1;
      const level = 7 + additionalLevels;
      const maxValue = STREAK_LEVELS.LEVEL6.maxValue + additionalLevels * 50;

      achievements = {
        level,
        longestStreak,
        maxValue,
      };
    } else {
      switch (true) {
        case longestStreak < STREAK_LEVELS.LEVEL1.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL1.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL1.maxValue,
          };
          break;
        case longestStreak < STREAK_LEVELS.LEVEL2.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL2.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL2.maxValue,
          };
          break;
        case longestStreak < STREAK_LEVELS.LEVEL3.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL3.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL3.maxValue,
          };
          break;
        case longestStreak < STREAK_LEVELS.LEVEL4.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL4.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL4.maxValue,
          };
          break;
        case longestStreak < STREAK_LEVELS.LEVEL5.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL5.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL5.maxValue,
          };
          break;
        case longestStreak < STREAK_LEVELS.LEVEL6.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL6.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL6.maxValue,
          };
          break;
      }
    }
    return achievements;
  }

  /**
   * @description This method is used to findLastConsecutiveZeroes
   * @param dayStreakArray
   * @returns {*}
   */
  public findLastConsecutiveZeroes(dayStreakArray: any) {
    let maxConsecutiveZeroes = 0;
    let currentConsecutiveZeroes = 0;
    for (let i = dayStreakArray.length - 1; i >= 0; i--) {
      if (dayStreakArray[i] === 0) {
        currentConsecutiveZeroes++;
      } else {
        break;
      }

      if (currentConsecutiveZeroes > maxConsecutiveZeroes) {
        maxConsecutiveZeroes = currentConsecutiveZeroes;
      }
    }
    return maxConsecutiveZeroes;
  }

  /**
   * @description This method is used to refill all life in exchange of fuel.
   * @param user
   * @returns {*}
   */
  public async refillLifeWithFuel(user: any) {
    if (user.lifeCount === DEFAULT_LIFE_COUNT) {
      throw new NetworkError("You already have 3 lives", 400);
    }
    const totalFuels = user.quizCoins + user.preLoadedCoins;
    if (totalFuels < REFILL_LIFE_FUEL) {
      throw new NetworkError(
        "You dont have sufficient fuels to refill life",
        400
      );
    }
    let updateQuery: any = { lifeCount: DEFAULT_LIFE_COUNT, renewLifeAt: null };
    if (totalFuels >= REFILL_LIFE_FUEL) {
      /**
       * once true check what to update preloaded or quiz coins or both
       */
      if (user.preLoadedCoins >= REFILL_LIFE_FUEL) {
        updateQuery = {
          ...updateQuery,
          preLoadedCoins: user.preLoadedCoins - REFILL_LIFE_FUEL,
        };
      } else {
        const amountLeftAfterPreloaded = REFILL_LIFE_FUEL - user.preLoadedCoins;

        if (amountLeftAfterPreloaded <= user.quizCoins) {
          updateQuery = {
            ...updateQuery,
            preLoadedCoins: 0,
            quizCoins: user.quizCoins - amountLeftAfterPreloaded,
          };
        }
      }
    }
    await UserTable.findOneAndUpdate(
      {
        _id: user._id,
      },
      {
        $set: updateQuery,
      }
    );
    return true;
  }

  /**
   * @description This method is used to refill life and update renewLifeAt field
   * @param user
   * @returns {*}
   */
  public async getUsersLatestLifeData(user: any) {
    const currentTime = Date.now();
    let renewLifeAt = null;
    let lifeCount = 0;
    if (!user.renewLifeAt) {
      renewLifeAt = new Date(currentTime + REFILL_INTERVAL).toISOString();
      await this.refillLifeIfNeeded(user, { renewLifeAt });
      return {
        renewLifeAt,
        lifeCount: user.lifeCount,
      };
    }
    let usersRenewLifeAt = new Date(user.renewLifeAt).valueOf();
    if (currentTime < usersRenewLifeAt) {
      return {
        renewLifeAt: user.renewLifeAt,
        lifeCount: user.lifeCount,
      };
    }
    const numOfLivesToRefill =
      1 + Math.floor((currentTime - usersRenewLifeAt) / REFILL_INTERVAL);
    lifeCount = Math.min(user.lifeCount + numOfLivesToRefill, 3);
    if (lifeCount < 3) {
      renewLifeAt = new Date(
        usersRenewLifeAt + numOfLivesToRefill * REFILL_INTERVAL
      ).toISOString();
    } else {
      renewLifeAt = null;
    }
    await this.refillLifeIfNeeded(user, { renewLifeAt, lifeCount });
    return {
      renewLifeAt,
      lifeCount,
    };
  }

  /**
   * @description This method is used to refill life in users
   * @param user
   * @param updatedData
   * @returns {*}
   */
  public async refillLifeIfNeeded(user: any, updatedData: any) {
    await UserTable.findOneAndUpdate(
      {
        _id: user._id,
      },
      updatedData,
      { new: true }
    );
    return updatedData;
  }
}

export default new UserDBService();
