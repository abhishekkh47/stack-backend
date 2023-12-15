import { NetworkError } from "@app/middleware";
import {
  WeeklyJourneyResultTable,
  QuizTable,
  DripshopItemTable,
  QuizResult,
} from "@app/model";
class WeeklyJourneyDBService {
  /**
   * @description create new community
   * @param weeklyJourneyDetails
   * @param userProgress
   * @returns {*}
   */
  public async getUserNextChallenge(
    userId: any,
    weeklyJourneyDetails: any,
    userProgress: any
  ) {
    try {
      let upcomingChallenge = [];
      if (userProgress.length == 0) {
        upcomingChallenge.push({ userId: userId });
        upcomingChallenge[0]["weeklyJourney"] = weeklyJourneyDetails[0];
        upcomingChallenge = JSON.parse(JSON.stringify(upcomingChallenge));
        Object.assign(upcomingChallenge[0].weeklyJourney, { actionNum: 1 });
      } else {
        let userJourney = await WeeklyJourneyResultTable.aggregate([
          {
            $match: {
              userId: userProgress[0].userId,
            },
          },
          {
            $lookup: {
              from: "weekly_journeys",
              localField: "weeklyJourneyId",
              foreignField: "_id",
              as: "weeklyJourney",
            },
          },
          {
            $unwind: {
              path: "$weeklyJourney",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              userId: 1,
              "weeklyJourney.actionNum": "$actionNum",
              "weeklyJourney.title": 1,
              "weeklyJourney.week": 1,
              "weeklyJourney.day": 1,
              "weeklyJourney.dailyGoal": 1,
              "weeklyJourney.actions": 1,
              "weeklyJourney.rewardType": 1,
              "weeklyJourney.reward": 1,
            },
          },
        ]).exec();

        upcomingChallenge = [...userJourney];
        const currentWeeklyJourney = userJourney[0].weeklyJourney;
        if (
          currentWeeklyJourney?.actionNum <
          currentWeeklyJourney?.actions?.length
        ) {
          upcomingChallenge = userJourney;
          upcomingChallenge[0].weeklyJourney.actionNum =
            upcomingChallenge[0].weeklyJourney.actionNum + 1;
        } else {
          if (currentWeeklyJourney.day < 7) {
            upcomingChallenge[0].weeklyJourney = weeklyJourneyDetails.filter(
              (dailyChallenge) => {
                return (
                  dailyChallenge.week == currentWeeklyJourney.week &&
                  dailyChallenge.day == currentWeeklyJourney.day + 1
                );
              }
            )[0];
            upcomingChallenge = JSON.parse(JSON.stringify(upcomingChallenge));
            Object.assign(upcomingChallenge[0].weeklyJourney, { actionNum: 1 });
          } else {
            upcomingChallenge[0].weeklyJourney = weeklyJourneyDetails.filter(
              (dailyChallenge) => {
                return (
                  dailyChallenge.week == currentWeeklyJourney.week + 1 &&
                  dailyChallenge.day == 1
                );
              }
            )[0];
            upcomingChallenge = JSON.parse(JSON.stringify(upcomingChallenge));
            Object.assign(upcomingChallenge[0].weeklyJourney, { actionNum: 1 });
          }
        }
      }

      let upcomingQuizId = null;
      let upcomingQuizDetails = null;
      let upcomingWeek = upcomingChallenge[0].weeklyJourney;
      let upcomingActionNum = upcomingChallenge[0].weeklyJourney.actionNum - 1;

      if (upcomingWeek.actions != null) {
        let correctAction = false;
        upcomingQuizId = upcomingWeek.actions[upcomingActionNum].quizId;
        correctAction = await this.getAction(userId, upcomingQuizId);
        while (correctAction == true) {
          upcomingActionNum = upcomingActionNum + 1;
          upcomingQuizId = upcomingWeek.actions[upcomingActionNum].quizId;
          correctAction = await this.getAction(userId, upcomingQuizId);
        }
        upcomingQuizDetails = await QuizTable.find({
          _id: upcomingQuizId,
        }).select("quizName quizType topicId ");
        upcomingWeek.actions[upcomingActionNum].quizDetails =
          upcomingQuizDetails[0];
      } else {
        const rewardDetails = await DripshopItemTable.find({
          _id: upcomingWeek.reward,
        }).select("name image description");
        upcomingWeek.rewardDetails = rewardDetails[0];
      }
      upcomingWeek.actionNum = upcomingActionNum + 1;
      return upcomingChallenge[0];
    } catch (err) {
      throw new NetworkError("Quiz Not Found", 400);
    }
  }

  public async getAction(userId: any, quizId: any) {
    const res = await QuizResult.find({ userId, quizId });
    return res.length > 0 ? true : false;
  }
}
export default new WeeklyJourneyDBService();
