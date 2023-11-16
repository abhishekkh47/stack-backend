import { NetworkError } from "@app/middleware";
import {
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
} from "@app/utility";

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
    if (quizExists.quizType === QUIZ_TYPE.NORMAL) {
      const quizQuestions = [];
      let queExistsFlag = true;
      if (reqParam.solvedQuestions.length > 0) {
        for (const solvedQue of reqParam.solvedQuestions) {
          const queExists = await QuizQuestionTable.findOne({
            _id: solvedQue,
          });
          if (!queExists) {
            queExistsFlag = false;
            break;
          }
          quizQuestions.push({
            topicId: quizExists.topicId,
            quizId: quizExists._id,
            userId: userIfExists._id,
            quizQuestionId: solvedQue,
            pointsEarned: queExists.points,
          });
        }
      }
      if (queExistsFlag === false) {
        throw new NetworkError("Question Doesn't Exists in db", 400);
      }
      /**
       * Add Question Result and Quiz Result
       */
      await QuizQuestionResult.insertMany(quizQuestions);
    }

    const pointsEarnedFromQuiz =
      quizExists.quizType === QUIZ_TYPE.NORMAL
        ? everyCorrectAnswerPoints * reqParam.solvedQuestions.length
        : SIMULATION_QUIZ_FUEL;

    const dataToCreate = {
      topicId: quizExists.topicId,
      quizId: quizExists._id,
      userId: userIfExists._id,
      isOnBoardingQuiz: false,
      pointsEarned: pointsEarnedFromQuiz,
      numOfIncorrectAnswers: reqParam.numOfIncorrectAnswers || 0,
    };
    await QuizResult.create(dataToCreate);
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
    let usersCommunityIfExists = await UserCommunityTable.findOne({
      userId: userIfExists._id,
    });
    if (usersCommunityIfExists) {
      await UserCommunityTable.findOneAndUpdate(
        { _id: usersCommunityIfExists._id },
        {
          $inc: {
            xpPoints: totalXPPoints,
          },
        }
      );
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
