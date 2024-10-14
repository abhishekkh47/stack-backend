import { AIToolsUsageStatusTable } from "@app/model";
import { UserTable } from "@app/model";
import {
  SEVEN_DAYS_TO_RESET,
  ALL_NULL_7_DAYS,
  DEFAULT_TIMEZONE,
  convertDateToTimeZone,
  getDaysBetweenDates,
  formattedDate,
  DEFAULT_BUSINESS_SCORE,
  BUSINESS_SCORE_MESSAGE,
} from "@app/utility/index";
import { IMDY } from "@app/types";
import { UserDBService as UserDBServiceV4 } from "@app/services/v4";
import { NetworkError } from "@app/middleware/error.middleware";

class UserService {
  /**
   * @description This service is used to check what AI tools the user has already visited
   * @param userIfExists
   */
  public async userAIToolUsageStatus(userIfExists: any) {
    const response = await AIToolsUsageStatusTable.find(
      {
        userId: userIfExists._id,
      },
      { usedAITools: 1 }
    );
    return response[0]?.usedAITools;
  }

  /**
   * @description This method is used to add businessScore
   * @param userDetails
   * @returns {*}
   */
  public async addBusinessScore(
    userDetails: any,
    userBusinessScore: number = DEFAULT_BUSINESS_SCORE
  ) {
    try {
      let isBusinessScoreToBeUpdated = false,
        message = "";
      let businessScore = {};
      const currentDate = convertDateToTimeZone(
        new Date(),
        userDetails.timezone
      );
      const { day = 0 } = userDetails?.businessScore?.updatedDate || 0;
      const diffDays = getDaysBetweenDates(
        userDetails?.businessScore?.updatedDate || currentDate,
        currentDate
      );
      if (!userDetails || day === 0 || diffDays === 1) {
        let last7days: any = userDetails?.businessScore?.last7days || [];
        message =
          this.getBusinessScoreMessage(last7days) ||
          BUSINESS_SCORE_MESSAGE.day_1;
        const earliestNullIndex = last7days.indexOf(null);
        if (earliestNullIndex !== -1) {
          last7days[earliestNullIndex] = 1;
        } else {
          last7days = SEVEN_DAYS_TO_RESET;
        }
        businessScore = {
          current: userDetails?.businessScore?.current + 1 || userBusinessScore,
          longest: Math.max(
            (userDetails?.businessScore?.current || 0) + 1,
            userDetails?.businessScore?.longest || 0
          ),
          isBusinessScoreInactive7Days: false,
          updatedDate: currentDate,
          last7days,
        };
        isBusinessScoreToBeUpdated = true;
      } else if (diffDays > 1) {
        message = BUSINESS_SCORE_MESSAGE.day_missed;
        const businessScoreDiffDays = getDaysBetweenDates(
          userDetails?.businessScore?.updatedDate || currentDate,
          currentDate
        );
        let currentBusinessScoreValue =
          userDetails?.businessScore?.current - businessScoreDiffDays + 2;
        let longestBusinessScoreValue = userDetails.businessScore?.longest || 0;
        const { last7days, isBusinessScoreInactive7Days } =
          this.modifyLast7DaysBusinessScore(
            diffDays,
            userDetails?.businessScore?.last7days || [],
            SEVEN_DAYS_TO_RESET,
            true
          );
        businessScore = {
          current: currentBusinessScoreValue,
          longest: longestBusinessScoreValue,
          isBusinessScoreInactive7Days,
          updatedDate: currentDate as IMDY,
          last7days,
        };
        isBusinessScoreToBeUpdated = true;
      }
      if (isBusinessScoreToBeUpdated) {
        const updatedBusinessScoreDetails = await UserTable.findOneAndUpdate(
          { _id: userDetails._id },
          {
            $set: {
              businessScore,
            },
          },
          { upsert: true, new: true }
        );
        const dayRange = this.get7DaysOfWeek(
          day > 0
            ? updatedBusinessScoreDetails.businessScore.updatedDate
            : currentDate,
          updatedBusinessScoreDetails.businessScore.last7days
        );
        return {
          last7DaysBusinessScore:
            updatedBusinessScoreDetails.businessScore.last7days,
          last7DaysWeek: dayRange,
          currentBusinessScore:
            updatedBusinessScoreDetails.businessScore.current,
          previousBusinessScore: userDetails.businessScore?.current || 90,
          message,
          buttonText: "LET'S GO!",
        };
      } else {
        const updatedBusinessScoreDetails = await UserTable.findOne({
          _id: userDetails._id,
        });
        const dayRange = this.get7DaysOfWeek(
          day > 0
            ? updatedBusinessScoreDetails.businessScore?.updatedDate
            : currentDate,
          updatedBusinessScoreDetails.businessScore.last7days
        );
        return {
          last7DaysBusinessScore:
            updatedBusinessScoreDetails.businessScore.last7days,
          last7DaysWeek: dayRange,
          currentBusinessScore:
            updatedBusinessScoreDetails.businessScore.current,
          previousBusinessScore: userDetails?.businessScore?.current || 90,
          message,
          buttonText: "LET'S GO!",
        };
      }
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This method is used to get7DaysOfWeek and give day range
   * @param date
   * @param last7days
   * @return {*}
   */
  public get7DaysOfWeek(date: any, last7days: any) {
    let dayRange = [];
    const notNullLast7DaysCount = (last7days || []).filter(
      (x) => x !== null
    ).length;
    let updatedDate: any = new Date(
      formattedDate(date.year, date.month, date.day)
    );

    notNullLast7DaysCount === 0
      ? updatedDate
      : updatedDate.setDate(updatedDate.getDate() - notNullLast7DaysCount + 1);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    for (let i = 0; i < 7; i++) {
      const dayIndex = updatedDate.getDay();
      const dayName = daysOfWeek[dayIndex];
      dayRange.push(dayName.charAt(0));
      updatedDate.setDate(updatedDate.getDate() + 1);
    }
    return dayRange;
  }

  /**
   * @description This method is used to modify the last 7 days array based on certain conditions
   * @param diffDays
   * @param last7days
   * @param reset7daysBusinessScore
   * @return {*}
   */
  public modifyLast7DaysBusinessScore(
    diffDays: number,
    last7days: any,
    reset7daysBusinessScore: any,
    isBusinessScoreAdded: boolean = true
  ) {
    try {
      let dayBusinessScores: any = [];
      let inactiveBusinessScoreCount = 0;
      const nullCount = (last7days || []).filter(
        (item) => item === null
      ).length;
      if (diffDays > nullCount) {
        dayBusinessScores = reset7daysBusinessScore;
        inactiveBusinessScoreCount = nullCount;
        const checkDiffDays = diffDays - nullCount;
        if (checkDiffDays < 8) {
          inactiveBusinessScoreCount += checkDiffDays - 1;
          dayBusinessScores = dayBusinessScores.fill(0, 0, checkDiffDays - 1);
        }
      } else {
        let nullCount = 0;
        dayBusinessScores = last7days.map((value) => {
          if (value === null) {
            nullCount++;
            if (nullCount < diffDays) {
              return 0;
            } else if (nullCount === diffDays && isBusinessScoreAdded) {
              return 1;
            }
          }
          return value;
        });
        inactiveBusinessScoreCount =
          UserDBServiceV4.findLastConsecutiveZeroes(dayBusinessScores);
      }
      return {
        last7days: dayBusinessScores,
        isBusinessScoreInactive7Days:
          inactiveBusinessScoreCount >= 7 ? true : false,
      };
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This method is used to modify the last 7 days array based on certain conditions
   * @param data
   * @return {*}
   */
  public async getBusinessScoreInfo(data: any) {
    try {
      const currentDate = convertDateToTimeZone(
        new Date(),
        data?.timezone || DEFAULT_TIMEZONE
      );
      const { day = 0 } = data.businessScore?.updatedDate || 0;
      const isFirstBusinessScore = day === 0;
      const diffDays = getDaysBetweenDates(
        data.businessScore?.updatedDate || currentDate,
        currentDate
      );
      if (!(isFirstBusinessScore || diffDays <= 1)) {
        const endDate = new Date(currentDate.date);
        let previousDate: any = new Date(
          endDate.setDate(endDate.getDate() - 1)
        );
        previousDate = {
          day: previousDate.getDate(),
          month: previousDate.getMonth() + 1,
          year: previousDate.getFullYear(),
        };
        const { last7days, isBusinessScoreInactive7Days } =
          this.modifyLast7DaysBusinessScore(
            diffDays,
            data?.businessScore?.last7days || [],
            ALL_NULL_7_DAYS,
            false
          );
        const businessScore = {
          current: data.businessScore.current || 0,
          longest: data.businessScore.longest,
          updatedDate: previousDate,
          isBusinessScoreInactive7Days,
          last7days,
        };
        let updateBusinessScoreQuery: any = {
          businessScore,
        };
        const updatedBusinessScore: any = await UserTable.findOneAndUpdate(
          { _id: data._id },
          {
            $set: updateBusinessScoreQuery,
          },
          { upsert: true, new: true }
        );
        data = {
          ...data,
          businessScoreInfo: updatedBusinessScore.businessScore,
        };
      }
      const dayRange = this.get7DaysOfWeek(
        (data?.businessScore?.updatedDate?.day || 0) !== 0
          ? data?.businessScore?.updatedDate
          : currentDate,
        data.businessScore?.last7days
      );
      data = { ...data, last7DaysWeek: dayRange };
      return data;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This method is used to modify the last 7 days array based on certain conditions
   * @param data
   * @return {*}
   */
  public getBusinessScoreMessage(last7Days: any) {
    try {
      let streak = 0;
      for (let i = 6; i >= 0; i--) {
        if (last7Days[i] == 1) {
          streak += 1;
        } else if (streak > 0) break;
      }

      if (streak < 7) {
        return BUSINESS_SCORE_MESSAGE[`day_${streak + 1}`];
      }
      return BUSINESS_SCORE_MESSAGE[`day_8`];
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}

export default new UserService();
