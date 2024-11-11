import { NetworkError } from "@app/middleware";
import {
  CommunityTable,
  QuizQuestionResult,
  QuizQuestionTable,
  QuizResult,
  UserCommunityTable,
  UserTable,
  ChecklistResultTable,
  BusinessProfileTable,
  QuizLevelTable,
} from "@app/model";
import { AnalyticsService } from "@app/services/v4";
import {
  ANALYTICS_EVENTS,
  MAX_STREAK_FREEZE,
  QUIZ_TYPE,
  XP_POINTS,
  executeWeeklyChallengeStepFunction,
  CORRECT_ANSWER_FUEL_POINTS,
  SIMULATION_RESULT_COPY,
  SIMULATION_QUIZ_FUEL,
  SIMULATION_REWARDS,
} from "@app/utility";
import { CommunityDBService } from "@app/services/v6";

class QuizDBService {
  /**
   * @description store quiz results data
   * @param userIfExists
   */
  public async storeQuizInformation(
    userIfExists: any,
    reqParam: any,
    quizExists: any
  ) {
    const { solvedQuestions, quizLevelId } = reqParam;
    let totalXPPoints = 0,
      resultScreenInfo = null,
      pointsEarnedFromQuiz = 0,
      cashEarnedFromQuiz = 0,
      ratingEarnedFromQuiz = 0;
    const milestoneLevel = await QuizLevelTable.findOne({ _id: quizLevelId });
    const quizType = quizExists.quizType;
    /**
     * Check question actually exists in that quiz
     */
    if (
      (quizType === QUIZ_TYPE.NORMAL || quizType === QUIZ_TYPE.STORY) &&
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
      QuizQuestionResult.insertMany(quizQuestions);
    }

    const numOfIncorrectAnswers = reqParam.numOfIncorrectAnswers || 0;
    pointsEarnedFromQuiz =
      quizType === QUIZ_TYPE.STORY
        ? CORRECT_ANSWER_FUEL_POINTS.STORY * solvedQuestions.length
        : CORRECT_ANSWER_FUEL_POINTS.QUIZ * solvedQuestions.length;

    if (
      numOfIncorrectAnswers > 2 &&
      quizExists.quizType === QUIZ_TYPE.SIMULATION
    ) {
      resultScreenInfo =
        milestoneLevel?.actions[2].resultCopyInfo.fail ||
        SIMULATION_RESULT_COPY.fail;
    } else {
      resultScreenInfo =
        milestoneLevel?.actions[2].resultCopyInfo.pass ||
        SIMULATION_RESULT_COPY.pass;
      pointsEarnedFromQuiz = SIMULATION_REWARDS.quizCoins;
      if (userIfExists.cash && userIfExists.cash > 0) {
        cashEarnedFromQuiz = SIMULATION_REWARDS.cash;
      } else {
        cashEarnedFromQuiz = SIMULATION_REWARDS.cash + 50; // add default cash for existing users
      }
      ratingEarnedFromQuiz = SIMULATION_REWARDS.businessScore;
    }
    QuizResult.create({
      topicId: reqParam?.topicId,
      quizId: quizExists._id,
      userId: userIfExists._id,
      isOnBoardingQuiz: false,
      pointsEarned: pointsEarnedFromQuiz,
      numOfIncorrectAnswers,
    });
    if (reqParam?.levelId && reqParam?.categoryId) {
      ChecklistResultTable.create({
        userId: userIfExists._id,
        topicId: reqParam.topicId,
        categoryId: reqParam.categoryId,
        levelId: reqParam.levelId,
        level: reqParam.level,
        actionNum: reqParam.actionNum,
      });
    }
    let incrementObj: any = {
      quizCoins: pointsEarnedFromQuiz,
      cash: cashEarnedFromQuiz,
      "businessScore.current": ratingEarnedFromQuiz,
      "businessScore.operationsScore": ratingEarnedFromQuiz,
      "businessScore.productScore": ratingEarnedFromQuiz,
      "businessScore.growthScore": ratingEarnedFromQuiz,
    };
    let query: any = {
      $inc: incrementObj,
    };
    totalXPPoints =
      XP_POINTS.COMPLETED_QUIZ +
      XP_POINTS.CORRECT_ANSWER * reqParam.solvedQuestions.length;
    incrementObj = { ...incrementObj, xpPoints: totalXPPoints };
    /**
     * If user is in community, please add xp accordingly for that community
     */
    let usersCommunityIfExists: any = await UserCommunityTable.findOne({
      userId: userIfExists._id,
    }).populate("communityId");
    if (usersCommunityIfExists) {
      const [_, isGoalAchieved] = await Promise.all([
        UserCommunityTable.findOneAndUpdate(
          { _id: usersCommunityIfExists._id },
          {
            $inc: {
              xpPoints: totalXPPoints,
            },
          }
        ),
        CommunityDBService.checkCommunityGoalAchievedOrNot(
          usersCommunityIfExists.communityId
        ),
      ]);
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
          CommunityTable.updateOne(
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
      streak: { freezeCount, current },
    } = userIfExists;
    if (freezeCount == 0 && current >= 0 && freezeCount <= MAX_STREAK_FREEZE) {
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
      isGiftedStreakFreeze: false,
      updatedUser: updatedXP,
      resultScreenInfo,
    };
  }

  /**
   * @description update goal count on completing a learning
   * @param userIfExists
   */
  public async updateGoalCount(userIfExists: any) {
    const updateObj = {
      $inc: {
        completedGoal: 1,
      },
    };
    await BusinessProfileTable.findOneAndUpdate(
      { userId: userIfExists._id },
      updateObj
    );
  }
}

export default new QuizDBService();
