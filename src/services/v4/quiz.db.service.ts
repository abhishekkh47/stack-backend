import { NetworkError } from "@app/middleware";
import {
  ANALYTICS_EVENTS,
  XP_POINTS,
  QUIZ_LIMIT_REACHED_TEXT,
} from "@app/utility";
import { ObjectId } from "mongodb";
import {
  ParentChildTable,
  QuizQuestionResult,
  QuizQuestionTable,
  QuizResult,
  QuizReview,
  QuizTopicTable,
  QuizTable,
  UserTable,
  StageTable,
} from "@app/model";
import mongoose from "mongoose";
import { EUserType, everyCorrectAnswerPoints } from "@app/types";
import { quizService } from "@services/v1";
import { AnalyticsService } from "@app/services/v4";

class QuizDBService {
  /**
   * @description get quiz data
   * @param quizIds
   */
  public async getQuizData(
    quizIds: string[],
    categoryId: string = null,
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
    if (categoryId) {
      matchQuery = { ...matchQuery, topicId: new ObjectId(categoryId) };
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
        $project: {
          _id: 1,
          image: 1,
          name: "$quizName",
          isCompleted: 1,
          xpPoints: 1,
          topicId: 1,
        },
      },
    ]).exec();
    if (quizData.length === 0 && !categoryId) {
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
        "_id order quizId text answer_array points question_image question_type answer_type"
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
   * @param childExists
   * @param userIfExists
   */
  public async storeQuizInformation(
    userId: string,
    headers: object,
    reqParam: any,
    quizExists: any,
    isTeen: boolean = null
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
    let totalXPPoints = 0;
    /**
     * Check question acutally exists in that quiz
     */
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
          userId: userId,
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

    const pointsEarnedFromQuiz =
      everyCorrectAnswerPoints * reqParam.solvedQuestions.length;

    const dataToCreate = {
      topicId: quizExists.topicId,
      quizId: quizExists._id,
      userId: userId,
      isOnBoardingQuiz: false,
      pointsEarned: pointsEarnedFromQuiz,
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
    totalXPPoints = correctAnswerXPPointsEarned + XP_POINTS.COMPLETED_QUIZ;
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
    return { totalXPPoints, updatedXPPoints: updatedXP.xpPoints };
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
    let quizReviewAlreadyExists = await QuizReview.findOne({
      quizId: reqParam.quizId,
      userId: user._id,
    });
    if (quizReviewAlreadyExists) {
      throw new NetworkError("Quiz Already Exists", 400);
    }
    const createdQuizReview = await QuizReview.create({
      userId: user._id,
      quizId: reqParam.quizId,
      quizName: quizExists.quizName,
      funLevel: reqParam.funLevel,
      difficultyLevel: reqParam.difficultyLevel,
      wantMore: reqParam.wantMore,
    });
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
        $project: {
          _id: 1,
          isCompleted: 1,
          name: "$quizName",
          topicId: 1,
          image: 1,
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
    let todaysQuizPlayed = null;
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
      isQuizLimitReached = todaysQuizPlayed.length >= 3 ? true : false;
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
    let quizCategories: any = await QuizTopicTable.find({
      type: 2,
      status: 1,
    })
      .select("_id topic image hasStages")
      .sort({ createdAt: -1 });
    if (quizCategories.length === 0) {
      throw new NetworkError(`Quiz Categories not found`, 400);
    }
    quizCategories = quizCategories.map((data) => {
      let categoryIfExists =
        quizResultsData.length !== 0
          ? quizResultsData.find(
              (x) => x.topicId.toString() == data._id.toString()
            )
          : null;

      return {
        _id: data._id,
        topic: data.topic,
        image: data.image,
        hasStages: data.hasStages,
        isStarted: categoryIfExists ? 1 : 0,
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
        $project: {
          _id: "$quizzes._id",
          name: "$quizzes.quizName",
          image: "$quizzes.image",
          isCompleted: 1,
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
   * @param categoryId
   * @param userId
   * @returns {*}
   */
  public async getStageWiseQuizzes(categoryId: string, userId: string) {
    const query: any = [
      {
        $match: {
          categoryId: new ObjectId(categoryId),
        },
      },
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
          },
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
                  isUnlocked: "$quizzes.isUnlocked",
                  xpPoints: "$quizzes.xpPoints",
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
    stages = stages.map((stage, index) => {
      if (index === 0) stage.isUnlocked = true;
      if (stage.quizzes.length !== 0) {
        const isAnyQuizUnlocked = stage.quizzes.filter(
          (x) => x.isUnlocked == true
        );
        if (isAnyQuizUnlocked.length === stage.quizzes.length) {
          if (stages[index + 1]) {
            stages[index + 1].isUnlocked = true;
          }
        } else {
          stage.isUnlocked = false;
        }
      }
      return stage;
    });
    return stages;
  }
}

export default new QuizDBService();
