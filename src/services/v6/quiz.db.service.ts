import { NetworkError } from "@app/middleware";
import {
  CommunityTable,
  QuizQuestionResult,
  QuizQuestionTable,
  QuizResult,
  UserCommunityTable,
  UserTable,
} from "@app/model";
import {
  AnalyticsService,
  QuizDBService as QuizDBServiceV4,
} from "@app/services/v4";
import { everyCorrectAnswerPoints } from "@app/types";
import {
  ANALYTICS_EVENTS,
  MAX_STREAK_FREEZE,
  QUIZ_LIMIT_REACHED_TEXT,
  QUIZ_TYPE,
  SIMULATION_QUIZ_FUEL,
  XP_POINTS,
  executeWeeklyChallengeStepFunction,
} from "@app/utility";
import { CommunityDBService } from "@app/services/v6";

class QuizDBService {
  /**
   * @description store quiz results data
   * @param userIfExists
   */
  public async storeQuizInformation(
    userIfExists: any,
    headers: object,
    reqParam: any,
    quizExists: any
  ) {
    const { solvedQuestions } = reqParam;
    let quizResultsData = await QuizResult.find({
      userId: userIfExists._id,
      isOnBoardingQuiz: false,
    });
    const isQuizLimitReached = await QuizDBServiceV4.checkQuizLimitReached(
      quizResultsData,
      userIfExists._id
    );
    if (isQuizLimitReached) {
      throw new NetworkError(QUIZ_LIMIT_REACHED_TEXT, 400);
    }
    let totalXPPoints = 0;
    /**
     * Check question acutally exists in that quiz
     */
    if (
      quizExists.quizType === QUIZ_TYPE.NORMAL &&
      solvedQuestions.length > 0
    ) {
      const questionsIfExist = await QuizQuestionTable.find({
        _id: { $in: solvedQuestions },
      });

      if (questionsIfExist.length < solvedQuestions.length) {
        throw new NetworkError("Question Doesn't Exists in db", 400);
      }

      const quizQuestions = questionsIfExist.map((que) => ({
        topicId: quizExists.topicId,
        quizId: quizExists._id,
        userId: userIfExists._id,
        quizQuestionId: que._id,
        pointsEarned: que.points,
      }));

      /**
       * Add Question Result and Quiz Result
       */
      await QuizQuestionResult.insertMany(quizQuestions);
    }

    const pointsEarnedFromQuiz =
      quizExists.quizType === QUIZ_TYPE.NORMAL
        ? everyCorrectAnswerPoints * reqParam.solvedQuestions.length
        : SIMULATION_QUIZ_FUEL;

    await QuizResult.create({
      topicId: quizExists.topicId,
      quizId: quizExists._id,
      userId: userIfExists._id,
      isOnBoardingQuiz: false,
      pointsEarned: pointsEarnedFromQuiz,
      numOfIncorrectAnswers: reqParam.numOfIncorrectAnswers || 0,
    });
    let incrementObj: any = {
      quizCoins: pointsEarnedFromQuiz,
    };
    let query: any = {
      $inc: incrementObj,
    };
    const correctAnswerXPPointsEarned =
      reqParam.solvedQuestions.length * XP_POINTS.CORRECT_ANSWER;
    totalXPPoints =
      quizExists.quizType === QUIZ_TYPE.NORMAL
        ? correctAnswerXPPointsEarned + XP_POINTS.COMPLETED_QUIZ
        : XP_POINTS.SIMULATION_QUIZ;
    incrementObj = { ...incrementObj, xpPoints: totalXPPoints };
    /**
     * If user is in community, please add xp accordingly for that community
     */
    let usersCommunityIfExists: any = await UserCommunityTable.findOne({
      userId: userIfExists._id,
    }).populate("communityId");
    if (usersCommunityIfExists) {
      await UserCommunityTable.findOneAndUpdate(
        { _id: usersCommunityIfExists._id },
        {
          $inc: {
            xpPoints: totalXPPoints,
          },
        }
      );
      const isGoalAchieved =
        await CommunityDBService.checkCommunityGoalAchievedOrNot(
          usersCommunityIfExists.communityId
        );
      if (
        isGoalAchieved &&
        !usersCommunityIfExists.communityId.isNextChallengeScheduled
      ) {
        const nextChallengeDate = CommunityDBService.getNextChallengeDate();
        const isScheduled = executeWeeklyChallengeStepFunction(
          `${usersCommunityIfExists.communityId.challenge.type} completed`,
          usersCommunityIfExists.communityId,
          nextChallengeDate
        );
        if (isScheduled) {
          await CommunityTable.updateOne(
            { _id: usersCommunityIfExists.communityId },
            {
              $set: {
                isNextChallengeScheduled: true,
              },
            }
          );
        }
      }
    }
    let isGiftedStreakFreeze = false;
    const {
      streak: { freezeCount },
    } = userIfExists;
    if (quizResultsData.length === 1 && freezeCount !== MAX_STREAK_FREEZE) {
      isGiftedStreakFreeze = true;
      incrementObj = { ...incrementObj, "streak.freezeCount": 1 };
    }
    query = {
      ...query,
      $inc: incrementObj,
      $set: { isQuizReminderNotificationSent: false },
    };
    const updatedXP: any = await UserTable.findOneAndUpdate(
      { _id: userIfExists._id },
      query,
      {
        new: true,
      }
    );

    AnalyticsService.sendEvent(
      ANALYTICS_EVENTS.CHALLENGE_COMPLETED,
      {
        "Challenge Name": quizExists.quizName,
        "Challenge Score": pointsEarnedFromQuiz,
      },
      {
        device_id: reqParam.deviceId,
        user_id: userIfExists._id,
      }
    );
    return {
      totalXPPoints,
      updatedXPPoints: updatedXP.xpPoints,
      totalFuel: pointsEarnedFromQuiz,
      isGiftedStreakFreeze,
    };
  }

  /**
   * @description This method is used to check today quiz played or not
   * @param userId
   * @returns {*}
   */
  public async checkQuizPlayedToday(userId: string) {
    const todayStart = new Date().setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date().setUTCHours(23, 59, 59, 999);
    const todaysQuizPlayed = await QuizResult.find({
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd,
      },
      isOnBoardingQuiz: false,
      userId: userId,
    });
    return todaysQuizPlayed.length > 0 ? true : false;
  }
}

export default new QuizDBService();
