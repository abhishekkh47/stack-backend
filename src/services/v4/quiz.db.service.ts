import { NetworkError } from "@app/middleware";
import {
  AdminTable,
  QuizQuestionResult,
  QuizQuestionTable,
  QuizResult,
  QuizReview,
  QuizTable,
  QuizTopicSuggestionTable,
  QuizTopicTable,
  StageTable,
  UserTable,
} from "@app/model";
import { AnalyticsService } from "@app/services/v4";
import { EUserType, everyCorrectAnswerPoints } from "@app/types";
import {
  ANALYTICS_EVENTS,
  getQuizBackgroundColor,
  QUIZ_LIMIT_REACHED_TEXT,
  QUIZ_TYPE,
  SIMULATION_QUIZ_FUEL,
  XP_POINTS,
} from "@app/utility";
import { quizService } from "@services/v1";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

class QuizDBService {
  /**
   * @description get quiz data
   * @param quizIds
   */
  public async getQuizData(
    quizIds: string[],
    topicId: string = null,
    status: number = null
  ) {
    let matchQuery: any = {
      $and: [
        {
          quizNum: {
            $exists: true,
          },
        },
        {
          quizNum: {
            $ne: 0,
          },
        },
      ],
    };
    if (topicId) {
      matchQuery = { ...matchQuery, topicId: new ObjectId(topicId) };
    }
    let quizData = await QuizTable.aggregate([
      {
        $match: matchQuery,
      },
      {
        $addFields: {
          isCompleted: {
            $cond: {
              if: {
                $in: ["$_id", quizIds],
              },
              then: true,
              else: false,
            },
          },
          xpPoints: XP_POINTS.COMPLETED_QUIZ,
        },
      },
      {
        $redact: {
          $cond: {
            if: {
              $eq: ["$isCompleted", status == 1 ? false : true],
            },
            then: "$$KEEP",
            else: status ? "$$PRUNE" : "$$KEEP",
          },
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
        $unwind: {
          path: "$quizTopics",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          image: 1,
          name: "$quizName",
          topicName: "$quizTopics.topic",
          isCompleted: 1,
          xpPoints: 1,
          fuelCount: {
            $multiply: [everyCorrectAnswerPoints, { $size: "$quizQuestions" }],
          },
          topicId: 1,
        },
      },
    ]).exec();
    if (quizData.length === 0 && !topicId) {
      throw Error("Quiz Not Found");
    }
    quizData = quizData.sort(() => 0.5 - Math.random());
    return quizData;
  }

  /**
   * @description get question list
   * @param userId
   * @param topicId
   * @param headers
   */
  public async getQuizQuestionList(
    userId: string,
    topicId: string,
    headers: object
  ) {
    let quizResultsData = await QuizResult.find({
      userId: userId,
      isOnBoardingQuiz: false,
    });
    const isQuizLimitReached = await this.checkQuizLimitReached(
      quizResultsData,
      userId
    );
    if (isQuizLimitReached) {
      throw new NetworkError(QUIZ_LIMIT_REACHED_TEXT, 400);
    }
    const quizIds: any = [];
    const quizCheckCompleted = await QuizResult.find(
      {
        userId: userId,
        topicId: topicId,
      },
      {
        _id: 0,
        quizId: 1,
      }
    ).select("quizId");
    if (quizCheckCompleted.length == 0) {
    } else {
      for (const quizId of quizCheckCompleted) {
        quizIds.push(quizId.quizId);
      }
    }
    const data = await QuizTable.findOne({
      topicId: topicId,
      _id: { $nin: quizIds },
    }).sort({ createdAt: 1 });
    if (!data) {
      throw new NetworkError("Quiz Not Found", 400);
    }
    const quizQuestionList = await QuizQuestionTable.find({
      quizId: data._id,
    }).select(
      "_id quizId text answer_array points question_image question_type answer_type"
    );
    return quizQuestionList;
  }

  /**
   * @description get quiz questions
   * @param userId
   * @param topicId
   * @param headers
   */
  public async getQuizQuestions(
    userId: string,
    quizId: string,
    headers: object,
    isCompleted: any = null
  ) {
    const query = {
      userId: userId,
      isOnBoardingQuiz: false,
    };
    let quizResultsData = await QuizResult.find({
      userId: userId,
      isOnBoardingQuiz: false,
    });
    if (!isCompleted) {
      const isQuizLimitReached = await this.checkQuizLimitReached(
        quizResultsData,
        userId
      );
      if (isQuizLimitReached) {
        throw new NetworkError(QUIZ_LIMIT_REACHED_TEXT, 400);
      }
    }
    const quizQuestionList = await QuizQuestionTable.find({
      quizId: quizId,
    })
      .select(
        "_id order quizId text answer_array points question_image question_type answer_type correctStatement incorrectStatement"
      )
      .sort({ order: 1 });
    return quizQuestionList;
  }

  /**
   * @description get total coins from quiz
   * @param userId
   * @param childExists
   * @param userIfExists
   */
  public async getTotalCoinsFromQuiz(
    userId: string,
    childExists: any,
    userIfExists: any
  ) {
    const newQuizData = await QuizResult.aggregate([
      {
        $match: {
          $or: [
            { userId: new mongoose.Types.ObjectId(userId) },
            {
              userId: childExists
                ? userIfExists.type == EUserType.PARENT
                  ? new mongoose.Types.ObjectId(childExists.firstChildId._id)
                  : new mongoose.Types.ObjectId(childExists.userId._id)
                : null,
            },
          ],
        },
      },
      {
        $group: {
          _id: 0,
          sum: {
            $sum: "$pointsEarned",
          },
        },
      },
      {
        $project: {
          _id: 0,
          sum: 1,
        },
      },
    ]).exec();
    return newQuizData.length > 0 ? newQuizData[0].sum : 0;
  }

  /**
   * @description store quiz results data
   * @param userId
   */
  public async storeQuizInformation(
    userId: string,
    headers: object,
    reqParam: any,
    quizExists: any
  ) {
    const { solvedQuestions } = reqParam;
    let quizResultsData = await QuizResult.find({
      userId: userId,
      isOnBoardingQuiz: false,
    });
    const isQuizLimitReached = await this.checkQuizLimitReached(
      quizResultsData,
      userId
    );
    if (isQuizLimitReached) {
      throw new NetworkError(QUIZ_LIMIT_REACHED_TEXT, 400);
    }
    let totalXPPoints = 0;
    /**
     * Check question acutally exists in that quiz
     */
    if (quizExists.quizType === QUIZ_TYPE.NORMAL && solvedQuestions.length > 0) {

      const questionsIfExist = await QuizQuestionTable.find({
        _id: { $in: solvedQuestions }
      });

      if (questionsIfExist.length < solvedQuestions.length) {
        throw new NetworkError("Question Doesn't Exists in db", 400);
      }

      const quizQuestions = questionsIfExist.map((que) => ({
        topicId: quizExists.topicId,
        quizId: quizExists._id,
        userId: userId,
        quizQuestionId: que._id,
        pointsEarned: que.points,
      }))

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
      userId: userId,
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
    query = {
      ...query,
      $inc: incrementObj,
      $set: { isQuizReminderNotificationSent: false },
    };
    const updatedXP: any = await UserTable.findOneAndUpdate(
      { _id: userId },
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
        user_id: userId,
      }
    );
    return {
      totalXPPoints,
      updatedXPPoints: updatedXP.xpPoints,
      totalFuel: pointsEarnedFromQuiz,
    };
  }

  /**
   * @description get quizinformation to sent in crm
   * @param userIfExists
   * @param userId
   */
  public async getQuizDataForCrm(
    userIfExists: any,
    userId: string,
    totalXPPoints: number
  ) {
    let preLoadedCoins = userIfExists.preLoadedCoins;
    const quizIfExists = await quizService.checkQuizExists({
      userId: new mongoose.Types.ObjectId(userIfExists._id),
      isOnBoardingQuiz: false,
    });
    let stackCoins = 0;
    if (quizIfExists.length > 0) {
      stackCoins = quizIfExists[0].sum;
    }
    stackCoins = stackCoins + preLoadedCoins;
    /**
     * Added Quiz information to zoho crm
     */
    let allQuizData: any = await QuizResult.find({
      userId: userId,
      isOnBoardingQuiz: false,
    }).populate("quizId");
    let quizDataForCrm = [];
    if (allQuizData.length > 0) {
      quizDataForCrm = allQuizData
        .filter((item) => item.quizId)
        .map((item, index) => {
          return {
            Quiz_Number: index + 1,
            Quiz_Name: item.quizId.quizName,
            Points: item.pointsEarned,
          };
        });
    }
    let dataSentInCrm: any = [
      {
        Account_Name: userIfExists.firstName + " " + userIfExists.lastName,
        Stack_Coins: stackCoins,
        New_Quiz_Information: quizDataForCrm,
        Email: userIfExists.email,
        XP: totalXPPoints,
      },
    ];
    return dataSentInCrm;
  }

  /**
   * @description get last quiz records
   */
  public async getLastQuizRecord() {
    const quizResults = await QuizResult.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $unwind: {
          path: "$users",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $redact: {
          $cond: {
            if: {
              $and: [
                {
                  $eq: ["$users.type", 1],
                },
                {
                  $eq: ["$users.isQuizReminderNotificationSent", false],
                },
              ],
            },
            then: "$$KEEP",
            else: "$$PRUNE",
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          pointsEarned: {
            $first: "$pointsEarned",
          },
          createdAt: {
            $first: "$createdAt",
          },
        },
      },
    ]).exec();
    return quizResults;
  }

  /**
   * @description get last quiz records
   */
  public async getUsersQuizResult() {
    const quizResults = await QuizResult.aggregate([
      {
        $match: {
          isOnBoardingQuiz: false,
        },
      },
      {
        $lookup: {
          from: "quiztopics",
          localField: "topicId",
          foreignField: "_id",
          as: "quizTopicData",
        },
      },
      {
        $unwind: {
          path: "$quizTopicData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "quiz",
          localField: "quizId",
          foreignField: "_id",
          as: "quizData",
        },
      },
      {
        $unwind: {
          path: "$quizData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $redact: {
          $cond: {
            if: {
              $eq: ["$quizTopicData.image", null],
            },
            then: "$$PRUNE",
            else: "$$KEEP",
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          firstName: {
            $first: "$userData.firstName",
          },
          lastName: {
            $first: "$userData.lastName",
          },
          email: {
            $first: "$userData.email",
          },
          quizInformation: {
            $addToSet: {
              pointsEarned: "$pointsEarned",
              quizName: "$quizData.quizName",
            },
          },
        },
      },
    ]).exec();
    if (quizResults.length === 0) throw new NetworkError("Quiz not found", 400);
    return quizResults;
  }

  /**
   * @description This method is used to store quiz review
   * @param reqParam
   * @param user
   */
  public async storeQuizReview(reqParam: any, user: any) {
    let quizExists = await QuizTable.findOne({ _id: reqParam.quizId });
    if (!quizExists) {
      throw new NetworkError("Quiz Doesn't Exists", 400);
    }
    let quizResultExists = await QuizResult.findOne({
      quizId: reqParam.quizId,
      userId: user._id,
      isOnBoardingQuiz: false,
    });
    if (!quizResultExists) {
      throw new NetworkError("You haven't played this quiz yet!", 400);
    }
    let quizReviewQuery: any = {
      userId: user._id,
      quizId: reqParam.quizId,
      quizName: quizExists.quizName,
    };
    if (reqParam.funLevel || reqParam.difficultyLevel || reqParam.wantMore) {
      quizReviewQuery = {
        ...quizReviewQuery,
        funLevel: reqParam.funLevel,
        difficultyLevel: reqParam.difficultyLevel,
        wantMore: reqParam.wantMore,
      };
    }
    /**
     * Separate API call for the below feedback review
     */
    if (reqParam.ratings || reqParam.feedback?.length > 0) {
      quizReviewQuery = {
        ...quizReviewQuery,
        ratings: reqParam.ratings,
        feedback: reqParam.feedback,
      };
    }
    const createdQuizReview = await QuizReview.findOneAndUpdate(
      {
        userId: user._id,
      },
      quizReviewQuery,
      {
        upsert: true,
        new: true,
      }
    );
    return createdQuizReview;
  }

  /**
   * @description This method is used to check all quiz available are played by teens or not
   * @param userId
   * @returns {*}
   */
  public async checkAllQuizPlayedByTeens(userId: string) {
    const isQuizRemaining = await QuizTable.aggregate([
      {
        $lookup: {
          from: "quizresults",
          let: {
            quizId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$userId", userId],
                    },
                    {
                      $eq: ["$quizId", "$$quizId"],
                    },
                  ],
                },
              },
            },
          ],
          as: "quizPlayed",
        },
      },
      {
        $match: {
          $and: [
            {
              image: {
                $ne: null,
              },
            },
            {
              $expr: {
                $eq: [
                  {
                    $size: "$quizPlayed",
                  },
                  0,
                ],
              },
            },
          ],
        },
      },
    ]).exec();
    if (isQuizRemaining.length == 0) {
      return false;
    }
    return true;
  }

  /**
   * @description  Get any 3 random quizzes
   * @returns {*}
   */
  public async getRandomQuiz() {
    const quizzes = await QuizTable.aggregate([
      {
        $match: {
          $and: [
            {
              quizNum: {
                $exists: true,
              },
            },
            {
              quizNum: {
                $ne: 0,
              },
            },
          ],
          stageId: null,
        },
      },
      {
        $sample: { size: 3 },
      },
      {
        $addFields: {
          isCompleted: false,
        },
      },
      {
        $lookup: {
          from: "quiztopics",
          localField: "topicId",
          foreignField: "_id",
          as: "quizTopicData",
        },
      },
      {
        $unwind: {
          path: "$quizTopicData",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 1,
          isCompleted: 1,
          name: "$quizName",
          topicId: 1,
          topicName: "$quizTopicData.topic",
          image: 1,
          characterImage: 1,
          characterName: 1,
        },
      },
    ]).exec();
    if (quizzes.length == 0) throw new NetworkError(`Quiz Not Found`, 400);
    return quizzes;
  }

  /**
   * @description  Check Quiz Limit Reached
   * @param quizResultsData
   * @param userId
   * @returns {boolean}
   */
  public async checkQuizLimitReached(quizResultsData: any, userId: string) {
    const [admin, user] = await Promise.all([
      AdminTable.findOne({}),
      UserTable.findOne({ _id: userId }).select("_id isLaunchpadApproved")
    ]);

    let todaysQuizPlayed = [];
    let isQuizLimitReached = false;
    if (quizResultsData.length > 0) {
      const todayStart = new Date().setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date().setUTCHours(23, 59, 59, 999);
      todaysQuizPlayed = await QuizResult.find({
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
        isOnBoardingQuiz: false,
        userId: userId,
      });
      isQuizLimitReached =
        todaysQuizPlayed.length >= admin.quizLimit
          ? user.isLaunchpadApproved
            ? false
            : true
          : false;
    }
    return isQuizLimitReached;
  }

  /**
   * @description  Get All Quiz Categories
   * @param quizResultsData
   * @returns {*}
   */
  public async listQuizCategories(quizResultsData: any) {
    /**
     * isStarted flag - 0 (start Journey) 1 ()
     */
    let quizCategories = await QuizTopicTable.aggregate([
      {
        $match: {
          type: 2,
          status: 1,
        },
      },
      {
        $lookup: {
          from: "quiz",
          localField: "_id",
          foreignField: "topicId",
          as: "quizzes",
        },
      },
      {
        $project: {
          _id: 1,
          topic: 1,
          hasStages: 1,
          image: 1,
          createdAt: 1,
          quizzes: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]).exec();
    if (quizCategories.length === 0) {
      throw new NetworkError(`Quiz Categories not found`, 400);
    }
    quizCategories = quizCategories.map((data: any, index: number) => {
      let categoryIfExists = false;
      quizResultsData.length !== 0
        ? quizResultsData.forEach((quizResult) => {
            const quizIfExists = data.quizzes.find(
              (x) => x._id.toString() == quizResult.quizId.toString()
            );
            if (quizIfExists) {
              categoryIfExists = true;
              return;
            }
          })
        : null;
      const colorsInformation = getQuizBackgroundColor(index);

      return {
        _id: data._id,
        topic: data.topic,
        image: data.image,
        hasStages: data.hasStages,
        isStarted: categoryIfExists ? 1 : 0,
        colorsInformation: { ...colorsInformation },
      };
    });
    return quizCategories;
  }

  /**
   * @description  Get most played category quizzes by user
   * @returns {*}
   */
  public async getMostPlayedCategoryQuizzes(userId: string) {
    const quizzes = await QuizResult.aggregate([
      {
        $lookup: {
          from: "quiz",
          localField: "quizId",
          foreignField: "_id",
          as: "quizData",
        },
      },
      {
        $unwind: {
          path: "$quizData",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          $and: [
            {
              "quizData.quizNum": {
                $exists: true,
              },
            },
            {
              "quizData.quizNum": {
                $ne: 0,
              },
            },
            {
              userId: userId,
            },
            {
              "quizData.stageId": null,
            },
          ],
        },
      },
      {
        $group: {
          _id: "$topicId",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $lookup: {
          from: "quiz",
          localField: "_id",
          foreignField: "topicId",
          as: "quizzes",
        },
      },
      {
        $unwind: {
          path: "$quizzes",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "quizresults",
          let: {
            quizId: "$quizzes._id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$userId", userId],
                    },
                    {
                      $eq: ["$quizId", "$$quizId"],
                    },
                  ],
                },
              },
            },
          ],
          as: "playedQuizzes",
        },
      },
      {
        $addFields: {
          isCompleted: false,
        },
      },
      {
        $match: {
          playedQuizzes: {
            $size: 0,
          },
        },
      },
      {
        $lookup: {
          from: "quiztopics",
          localField: "quizzes.topicId",
          foreignField: "_id",
          as: "quizTopicData",
        },
      },
      {
        $unwind: {
          path: "$quizTopicData",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: "$quizzes._id",
          name: "$quizzes.quizName",
          image: "$quizzes.image",
          isCompleted: 1,
          topicName: "$quizTopicData.topic",
          characterImage: "$quizzes.characterImage",
          characterName: "$quizzes.characterName",
          topicId: "$quizzes.topicId",
          count: 1,
        },
      },
      {
        $limit: 3,
      },
    ]).exec();
    if (quizzes.length == 0) {
      const otherCategoryQuizzes = await QuizTopicTable.aggregate([
        {
          $match: {
            type: 2,
            image: {
              $ne: null,
            },
          },
        },
        {
          $lookup: {
            from: "quizresults",
            let: {
              id: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$userId", userId],
                      },
                      {
                        $eq: ["$topicId", "$$id"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "playedQuizzes",
          },
        },
        {
          $redact: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: "$playedQuizzes",
                  },
                  0,
                ],
              },
              then: "$$PRUNE",
              else: "$$KEEP",
            },
          },
        },
        {
          $lookup: {
            from: "quiz",
            localField: "_id",
            foreignField: "topicId",
            as: "quizData",
          },
        },
        {
          $unwind: {
            path: "$quizData",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $replaceRoot: {
            newRoot: "$quizData",
          },
        },
        {
          $sample: {
            size: 3,
          },
        },
        {
          $addFields: {
            isCompleted: 0,
            count: 0,
          },
        },
        {
          $project: {
            _id: 1,
            name: "$quizName",
            image: 1,
            isCompleted: 1,
            topicId: 1,
            count: 1,
          },
        },
      ]).exec();
      return otherCategoryQuizzes;
    }
    return quizzes;
  }

  /**
   * @description  Get most played category quizzes by user
   * @param topics
   * @param userId
   * @returns {*}
   */
  public async getStageWiseQuizzes(
    topics: string[],
    userId: string,
    isNormalQuiz: boolean
  ) {
    let matchedQuery: any = { categoryId: { $in: topics } };
    if (isNormalQuiz) {
      matchedQuery = { ...matchedQuery, "quizzes.quizType": QUIZ_TYPE.NORMAL };
    }
    const query: any = [
      {
        $lookup: {
          from: "quiz",
          localField: "_id",
          foreignField: "stageId",
          as: "quizzes",
        },
      },
      {
        $unwind: {
          path: "$quizzes",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: matchedQuery,
      },
      {
        $lookup: {
          from: "quizquestions",
          localField: "quizzes._id",
          foreignField: "quizId",
          as: "quizzes.quizQuestions",
        },
      },
      {
        $lookup: {
          from: "quiztopics",
          localField: "quizzes.topicId",
          foreignField: "_id",
          as: "quizzes.quizTopics",
        },
      },
      {
        $unwind: {
          path: "$quizzes.quizTopics",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "quizresults",
          let: {
            quizId: "$quizzes._id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$userId", userId],
                    },
                    {
                      $eq: ["$quizId", "$$quizId"],
                    },
                  ],
                },
              },
            },
          ],
          as: "quizResults",
        },
      },
      {
        $addFields: {
          quizzes: {
            isUnlocked: {
              $cond: {
                if: { $ifNull: ["$quizzes", false] },
                then: {
                  $cond: {
                    if: {
                      $gt: [
                        {
                          $size: "$quizResults",
                        },
                        0,
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
                else: "$$REMOVE",
              },
            },
            xpPoints: {
              $cond: {
                if: { $ifNull: ["$quizzes", false] },
                then: XP_POINTS.COMPLETED_QUIZ,
                else: "$$REMOVE",
              },
            },
            fuelCount: {
              $cond: {
                if: { $ifNull: ["$quizzes", false] },
                then: {
                  $cond: {
                    if: { $eq: ["$quizzes.quizType", QUIZ_TYPE.SIMULATION] },
                    then: SIMULATION_QUIZ_FUEL,
                    else: {
                      $multiply: [
                        everyCorrectAnswerPoints,
                        { $size: "$quizzes.quizQuestions" },
                      ],
                    },
                  },
                },
                else: "$$REMOVE",
              },
            },
          },
        },
      },
      {
        $sort: {
          "quizzes.quizType": 1,
        },
      },
      {
        $group: {
          _id: "$_id",
          title: {
            $first: "$title",
          },
          subTitle: {
            $first: "$subTitle",
          },
          categoryId: {
            $first: "$categoryId",
          },
          order: {
            $first: "$order",
          },
          guidebook: {
            $first: "$guidebook",
          },
          backgroundColor: {
            $first: "$backgroundColor",
          },
          guidebookColor: {
            $first: "$guidebookColor",
          },
          description: {
            $first: "$description",
          },
          quizzes: {
            $push: {
              $cond: {
                if: { $eq: [{ $size: { $objectToArray: "$quizzes" } }, 0] },
                then: "$$REMOVE",
                else: {
                  _id: "$quizzes._id",
                  name: "$quizzes.quizName",
                  image: "$quizzes.image",
                  topicId: "$quizzes.topicId",
                  stageId: "$quizzes.stageId",
                  isCompleted: "$quizzes.isUnlocked",
                  xpPoints: "$quizzes.xpPoints",
                  fuelCount: "$quizzes.fuelCount",
                  quizType: "$quizzes.quizType",
                  isUnlocked: "$quizzes.isUnlocked",
                  characterName: "$quizzes.characterName",
                  characterImage: "$quizzes.characterImage",
                  topicName: "$quizzes.quizTopics.topic",
                },
              },
            },
          },
        },
      },
      {
        $sort: {
          order: 1,
        },
      },
    ];
    let stages = await StageTable.aggregate(query).exec();
    if (stages.length === 0) throw new NetworkError("Stages Not Found", 400);
    let index = 0;
    for (let stage of stages) {
      if (index === 0) {
        stage.isUnlocked = true;
      } else {
        if (stage.quizzes.length !== 0) {
          const previousAllQuizUnlocked = stages[index - 1].quizzes.filter(
            (x) => x.isCompleted == true
          );
          const previousAllQuizzes = stages[index - 1].quizzes.length;
          if (
            stages[index - 1].isUnlocked === true &&
            previousAllQuizUnlocked.length === previousAllQuizzes
          ) {
            stage.isUnlocked = true;
          } else {
            stage.isUnlocked = false;
          }
        }
      }
      if (stage.isUnlocked) {
        stage.quizzes.forEach((quiz) => {
          if (quiz.quizType === QUIZ_TYPE.NORMAL) {
            quiz.isUnlocked = true;
          }
        });
      } else {
        stage.quizzes.forEach((quiz) => {
          quiz.isUnlocked = false;
        });
      }
      // Filter quizzes of quizType 1 in the current stage
      const allNormalQuizzesInStage = stages[index].quizzes.filter(
        (x) => x.quizType === QUIZ_TYPE.NORMAL
      );

      // Check if all normal quizzes in the current stage are completed
      const allNormalQuizzesCompleted = allNormalQuizzesInStage.every(
        (x) => x.isCompleted == true
      );

      // Find the index of the first quizType 2 quiz that is not completed
      const simulationQuizIndex = stage.quizzes.findIndex(
        (x) => x.quizType == QUIZ_TYPE.SIMULATION && x.isCompleted == false
      );
      // Unlock the simulation quiz if the conditions are met
      if (
        stage.isUnlocked &&
        allNormalQuizzesCompleted &&
        simulationQuizIndex !== -1
      ) {
        stages[index].quizzes[simulationQuizIndex].isUnlocked = true;
      }
      index++;
    }
    return stages;
  }

  /**
   * @description  Get first quiz from stage 1
   * @returns {*}
   */
  public async getFirstQuizFromStageOne() {
    const query: any = [
      {
        $match: {
          order: 1,
        },
      },
      {
        $lookup: {
          from: "quiz",
          localField: "_id",
          foreignField: "stageId",
          as: "quiz",
        },
      },
      {
        $unwind: {
          path: "$quiz",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "quiztopics",
          localField: "quiz.topicId",
          foreignField: "_id",
          as: "quiz.quizTopics",
        },
      },
      {
        $unwind: {
          path: "$quiz.quizTopics",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "quiz.quizType": QUIZ_TYPE.NORMAL,
        },
      },
      {
        $sort: {
          "quiz.quizNum": 1,
        },
      },
      {
        $limit: 1,
      },
      {
        $project: {
          _id: 1,
          title: 1,
          subTitle: 1,
          categoryId: 1,
          description: 1,
          quiz: {
            _id: "$quiz._id",
            quizNum: "$quiz.quizNum",
            image: "$quiz.image",
            name: "$quiz.quizName",
            topicId: "$quiz.topicId",
            stageId: "$quiz.stageId",
            topicName: "$quiz.quizTopics.topic",
          },
        },
      },
    ];
    const quiz = await StageTable.aggregate(query).exec();
    return quiz;
  }

  /**
   * @description  Search Quiz based on text
   * @param text
   * @param userId
   * @returns {*}
   */
  public async searchQuiz(text: string, userId: any) {
    const escapedText = text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const query: any = [
      {
        $match: {
          $and: [
            {
              quizNum: {
                $exists: true,
              },
            },
            {
              quizNum: {
                $ne: 0,
              },
            },
            {
              $or: [
                {
                  quizName: {
                    $regex: escapedText,
                    $options: "i",
                  },
                },
                {
                  tags: {
                    $regex: escapedText,
                    $options: "i",
                  },
                },
              ],
            },
          ],
        },
      },
      {
        $lookup: {
          from: "quizresults",
          let: {
            quizId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$userId", userId],
                    },
                    {
                      $eq: ["$quizId", "$$quizId"],
                    },
                  ],
                },
              },
            },
          ],
          as: "quizPlayed",
        },
      },
      {
        $lookup: {
          from: "stages",
          localField: "stageId",
          foreignField: "_id",
          as: "stages",
        },
      },
      {
        $unwind: {
          path: "$stages",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "quiztopics",
          localField: "topicId",
          foreignField: "_id",
          as: "topics",
        },
      },
      {
        $unwind: {
          path: "$topics",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isCompleted: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: "$quizPlayed",
                  },
                  0,
                ],
              },
              then: false,
              else: true,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          topicId: 1,
          image: 1,
          tags: 1,
          quizNum: 1,
          isCompleted: 1,
          quizType: 1,
          characterImage: 1,
          characterName: 1,
          isUnlocked: "$isCompleted",
          stageId: 1,
          name: "$quizName",
          topicName: "$topics.topic",
          stageName: {
            $cond: {
              if: {
                $eq: ["$stageId", null],
              },
              then: "$topics.topic",
              else: {
                $concat: ["$topics.topic", ": ", "$stages.subTitle"],
              },
            },
          },
        },
      },
    ];
    const quizzes = await QuizTable.aggregate(query).exec();
    if (quizzes.length === 0) return [];

    const anyQuizWithStage = quizzes.filter((obj, index) => {
      return (
        index ===
        quizzes.findIndex(
          (o) =>
            obj.topicId.toString() === o.topicId.toString() &&
            obj.stageId !== null
        )
      );
    });

    let topicIds = [];
    let stages = [];
    if (anyQuizWithStage.length > 0) {
      topicIds = anyQuizWithStage.map((x) => x.topicId);
      stages = await this.getStageWiseQuizzes(topicIds, userId, false);
    }

    for (let quiz of quizzes) {
      if (quiz.stageId) {
        const findStage = stages.find(
          (x) => x._id.toString() == quiz.stageId.toString()
        );
        if (findStage?.isUnlocked) {
          const filterQuiz = findStage.quizzes.find(
            (x) => x._id.toString() == quiz._id.toString()
          );
          quiz.isUnlocked = filterQuiz.isUnlocked;
        } else {
          quiz.isUnlocked = false;
        }
      } else {
        quiz.isUnlocked = true;
      }
    }

    return quizzes;
  }

  /*
   * @description  Create quiz topic and give error once max limit of suggestion reached
   * @param userId
   * @returns {*}
   */
  public async createQuizTopicSuggestion(userId: string, topic: string) {
    try {
      const usersSuggestion = await QuizTopicSuggestionTable.find({
        userId: userId,
      });
      if (usersSuggestion.length >= 10) {
        throw new NetworkError(
          "Sorry, You can maximum suggest only upto 10 suggestions.",
          400
        );
      }
      const isSameSuggestion = usersSuggestion.find((x) => x.topic == topic);
      if (isSameSuggestion) {
        throw new NetworkError(
          "Sorry, You can't submit same suggestion. Try a different one!",
          400
        );
      }
      const quizTopicSuggestion = await QuizTopicSuggestionTable.create({
        topic,
        userId,
      });
      return quizTopicSuggestion;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description  This method is used to give quiz recommendations to user based on played quizzes
   * @param userId
   * @returns {*}
   */
  public async getQuizRecommendations(
    userId: string,
    currentCategory: string = null
  ) {
    try {
      let quizRecommendations = [];
      let quizzes = await QuizTable.aggregate([
        {
          $match: {
            $and: [
              {
                quizNum: {
                  $exists: true,
                },
              },
              {
                quizNum: {
                  $ne: 0,
                },
              },
            ],
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
          $unwind: {
            path: "$quizTopics",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "quizresults",
            let: {
              quizId: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$userId", new ObjectId(userId)],
                      },
                      {
                        $eq: ["$quizId", "$$quizId"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "quizPlayed",
          },
        },
        {
          $redact: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: "$quizPlayed",
                  },
                  0,
                ],
              },
              then: "$$PRUNE",
              else: "$$KEEP",
            },
          },
        },
        {
          $lookup: {
            from: "stages",
            localField: "stageId",
            foreignField: "_id",
            as: "stages",
          },
        },
        {
          $unwind: {
            path: "$stages",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            sortOnStage: {
              $cond: {
                if: {
                  $ifNull: ["$stageId", false],
                },
                then: 1,
                else: 0,
              },
            },
            fuelCount: {
              $cond: {
                if: { $eq: ["$quizType", QUIZ_TYPE.SIMULATION] },
                then: SIMULATION_QUIZ_FUEL,
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
        {
          $group: {
            _id: "$stageId",
            hasQuizTypeNormal: {
              $max: {
                $cond: {
                  if: {
                    $eq: ["$quizType", 1],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            docs: {
              $push: "$$ROOT",
            },
          },
        },
        {
          $unwind: {
            path: "$docs",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              {
                _id: null,
              },
              {
                _id: {
                  $ne: null,
                },
                hasQuizTypeNormal: 1,
                "docs.quizType": {
                  $ne: 2,
                },
              },
              {
                _id: {
                  $ne: null,
                },
                hasQuizTypeNormal: 0,
                "docs.quizType": {
                  $ne: 1,
                },
              },
            ],
          },
        },
        {
          $replaceRoot: {
            newRoot: "$docs",
          },
        },
        {
          $sort: {
            "quizTopics.createdAt": -1,
            "stages.order": 1,
            sortOnStage: -1,
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            quizNum: 1,
            topicId: 1,
            characterImage: 1,
            characterName: 1,
            name: "$quizName",
            topicName: "$quizTopics.topic",
            quizType: 1,
            sortOnStage: 1,
            fuelCount: 1,
            image: 1,
            order: {
              $ifNull: ["$stages.order", null],
            },
            stageId: 1,
          },
        },
      ]).exec();
      if (quizzes.length === 0) return [];
      const stageId = quizzes[0]?.stageId?.toString() || null;
      const stageQuizRecommendations = quizzes.filter(
        (x) => x.stageId && x.stageId.toString() == stageId
      );
      let isStageQuizIncluded = false;
      let otherCategoryRecommendationsLength = 0;
      if (stageQuizRecommendations.length > 0) {
        isStageQuizIncluded = true;
        quizRecommendations = stageQuizRecommendations.slice(0, 2);
      } else {
        quizRecommendations = quizzes.slice(0, 2);
      }

      let quizRecommendationsIds = quizRecommendations.map((recommendation) =>
        recommendation._id.toString()
      );

      otherCategoryRecommendationsLength = 3 - quizRecommendations.length;
      const currentCategoryQuizRecommendations = quizzes
        .filter((x) => {
          const matchedCondition =
            (!currentCategory ||
              x.topicId.toString() == currentCategory.toString()) &&
            !quizRecommendationsIds.includes(x._id.toString());
          if (isStageQuizIncluded) {
            return matchedCondition && !x.stageId;
          }
          return matchedCondition;
        })
        .slice(0, otherCategoryRecommendationsLength);
      if (currentCategoryQuizRecommendations.length > 0) {
        quizRecommendations = quizRecommendations.concat(
          currentCategoryQuizRecommendations
        );
        quizRecommendationsIds = quizRecommendations.map((recommendation) =>
          recommendation._id.toString()
        );
      }
      if (quizRecommendations.length < 3) {
        const otherCategoryRecommendations = quizzes
          .filter((x) => {
            const matchedCondition =
              (!currentCategory ||
                x.topicId.toString() !== currentCategory.toString()) &&
              !quizRecommendationsIds.includes(x._id.toString());
            if (isStageQuizIncluded) {
              return matchedCondition && !x.stageId;
            }
            return matchedCondition;
          })
          .slice(0, 3 - quizRecommendations.length);
        if (otherCategoryRecommendations.length > 0) {
          quizRecommendations = quizRecommendations.concat(
            otherCategoryRecommendations
          );
        }
      }
      return quizRecommendations;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}

export default new QuizDBService();
