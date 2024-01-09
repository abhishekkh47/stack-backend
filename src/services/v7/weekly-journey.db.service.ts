import { NetworkError } from "@app/middleware";
import { WeeklyJourneyResultTable, QuizTable, QuizResult } from "@app/model";
import {
  QUIZ_TYPE,
  SIMULATION_QUIZ_FUEL,
  XP_POINTS,
  WEEKLY_REWARD_ACTION_NUM,
} from "@app/utility";
import { everyCorrectAnswerPoints } from "@app/types";
import { ObjectId } from "mongodb";
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
            $sort: {
              createdAt: -1,
            },
          },
          { $limit: 1 },
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
              "weeklyJourney._id": "$weeklyJourney._id",
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

        if (
          userJourney[0].weeklyJourney.week == 4 &&
          userJourney[0].weeklyJourney.day == 7 &&
          userJourney[0].weeklyJourney.actionNum == 3
        ) {
          return [];
        }
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

        const newData = await QuizTable.aggregate([
          {
            $match: {
              _id: new ObjectId(upcomingQuizId),
            },
          },
          {
            $lookup: {
              from: "quizquestions",
              localField: "_id",
              foreignField: "quizId",
              as: "quizQuestions",
            },
          },
          {
            $lookup: {
              from: "quiztopics",
              localField: "topicId",
              foreignField: "_id",
              as: "quizTopics",
            },
          },
          {
            $addFields: {
              quizQuestionsFiltered: {
                $filter: {
                  input: "$quizQuestions",
                  as: "question",
                  cond: {
                    $and: [
                      {
                        $eq: ["$$question.question_type", 2],
                      },
                      {
                        $eq: ["$quizType", 3],
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            $addFields: {
              quizQuestionsLength: { $size: "$quizQuestionsFiltered" },
            },
          },
          {
            $addFields: {
              isUnlocked: false,
              xpPoints: XP_POINTS.COMPLETED_QUIZ,
              fuelCount: {
                $cond: {
                  if: { $eq: ["$quizType", QUIZ_TYPE.SIMULATION] },
                  then: SIMULATION_QUIZ_FUEL,
                  else: {
                    $cond: {
                      if: { $eq: ["$quizType", QUIZ_TYPE.STORY] },
                      then: {
                        $multiply: [
                          everyCorrectAnswerPoints,
                          "$quizQuestionsLength",
                        ],
                      },
                      else: {
                        $multiply: [
                          everyCorrectAnswerPoints,
                          { $size: "$quizQuestions" },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              _id: upcomingQuizId,
              name: "$quizName",
              image: 1,
              topicId: 1,
              stageId: 1,
              isCompleted: 1,
              xpPoints: 1,
              fuelCount: 1,
              quizType: 1,
              isUnlocked: 1,
              characterName: 1,
              characterImage: 1,
              topicName: { $arrayElemAt: ["$quizTopics.topic", 0] },
            },
          },
        ]);

        upcomingWeek.actions[upcomingActionNum].quizDetails = newData[0];
      }
      upcomingWeek.actionNum = upcomingActionNum + 1;
      return upcomingChallenge[0];
    } catch (err) {
      throw new NetworkError("Daily Challenge Not Found ", 400);
    }
  }

  /**
   * @description Check if quiz is already completed
   * @param userId
   * @param quizId
   * @returns {*}
   */
  public async getAction(userId: any, quizId: any) {
    const res = await QuizResult.find({ userId, quizId });
    return res.length > 0 ? true : false;
  }

  /**
   * @description get all weekly challenges and unlocked rewards
   * @param weeklyJourneyDetails
   * @param userNextChallenge
   * @returns {*}
   */
  public async getWeekDetails(
    weeklyJourneyDetails: any,
    userNextChallenge: any
  ) {
    try {
      const groupedByWeek = weeklyJourneyDetails.reduce((acc, item) => {
        const week = item.week;
        let userWeek = 0;
        if (!userNextChallenge.weeklyJourney) {
          userWeek = 5;
        } else {
          userWeek = userNextChallenge.weeklyJourney.week;
        }
        if (
          !acc[week] &&
          item.day == 7 &&
          (userWeek > week ||
            (userWeek == week && userNextChallenge.weeklyJourney.day == 7))
        ) {
          acc[week] = {
            id: item._id,
            week,
            title: item.title,
            reward: {
              description: item.reward,
              image: null,
              name: "1:1 Mentorship with a Startup Founder",
            },
          };
        } else if (!acc[week] && item.day == 7) {
          acc[week] = {
            id: item._id,
            week,
            title: item.title,
          };
        }
        return acc;
      }, {});

      // Create an array of weeks
      const arrayOfWeeks = Object.values(groupedByWeek);
      return arrayOfWeeks;
    } catch (err) {
      throw new NetworkError("Quiz Not Found", 400);
    }
  }

  /**
   * @description store status for weekly reward claim
   * @param userID
   * @param reqParam
   * @returns {*}
   */
  public async storeWeeklyReward(userId: any, reqParam: any) {
    try {
      const updatedData = {
        weeklyJourneyId: reqParam.weeklyJourneyId,
        actionNum: WEEKLY_REWARD_ACTION_NUM,
        userId: userId,
        actionInput: null,
      };
      await WeeklyJourneyResultTable.findOneAndUpdate(
        {
          weeklyJourneyId: reqParam.weeklyJourneyId,
        },
        updatedData,
        { upsert: true }
      );
      return;
    } catch (err) {
      throw new NetworkError("Error occured while claiming the reward", 400);
    }
  }
}
export default new WeeklyJourneyDBService();
