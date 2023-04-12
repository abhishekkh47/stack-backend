import { NetworkError } from "@app/middleware";
import {
  get72HoursAhead,
  getQuizCooldown,
  ANALYTICS_EVENTS,
} from "@app/utility";
import {
  ParentChildTable,
  QuizQuestionResult,
  QuizQuestionTable,
  QuizResult,
  QuizTable,
  QuizTopicTable,
  UserTable,
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
  public async getQuizData(quizIds: string[]) {
    const quizData = await QuizTopicTable.aggregate([
      {
        $sort: { createdAt: 1 },
      },
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
        $addFields: {
          isCompleted: {
            $cond: {
              if: {
                $in: ["$quizData._id", quizIds],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: "$quizData._id",
          image: "$quizData.image",
          name: "$quizData.quizName",
          isCompleted: 1,
          topicId: "$_id",
        },
      },
    ]).exec();
    if (quizData.length === 0) {
      throw Error("Quiz Not Found");
    }
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
    const quizCheck: any = await QuizResult.findOne({
      userId: userId,
      topicId: topicId,
    }).sort({ createdAt: -1 });
    const quizIds: any = [];
    if (quizCheck !== null) {
      const Time = await get72HoursAhead(quizCheck.createdAt);
      const quizCooldown = await getQuizCooldown(headers);
      if (Time < quizCooldown) {
        throw new NetworkError(
          `Quiz is locked. Please wait for ${quizCooldown} hours to unlock this quiz`,
          400
        );
      }
    }
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
    headers: object
  ) {
    const query = {
      userId: userId,
      isOnBoardingQuiz: false,
    };
    const quizCheck: any = await QuizResult.findOne(query).sort({
      createdAt: -1,
    });
    if (quizCheck !== null) {
      const Time = await get72HoursAhead(quizCheck.createdAt);
      const quizCooldown = await getQuizCooldown(headers);
      if (Time < quizCooldown) {
        throw new NetworkError(
          `Quiz is locked. Please wait for ${quizCooldown} hours to unlock this quiz`,
          400
        );
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
    isTeen: boolean
  ) {
    const lastQuizPlayed = await QuizResult.findOne({
      userId: userId,
      isOnBoardingQuiz: false,
    }).sort({ createdAt: -1 });
    const quizCooldown = await getQuizCooldown(headers);
    if (lastQuizPlayed) {
      const timeDiff = await get72HoursAhead(lastQuizPlayed.createdAt);
      if (timeDiff <= quizCooldown) {
        throw new NetworkError(
          `Quiz is locked. Please wait for ${quizCooldown} hours to unlock this quiz`,
          400
        );
      }
    }
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
    let query: any = {
      $inc: {
        quizCoins: pointsEarnedFromQuiz,
      },
    };
    if (isTeen) {
      query = { ...query, $set: { isQuizReminderNotificationSent: false } };
    }
    await UserTable.updateOne({ _id: userId }, query);

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

    return true;
  }

  /**
   * @description get quizinformation to sent in crm
   * @param userIfExists
   * @param userId
   */
  public async getQuizDataToSentInCrm(userIfExists: any, userId: string) {
    let userExistsForQuiz = null;
    let preLoadedCoins = 0;
    let isParentOrChild = 0;
    if (userIfExists.type == EUserType.PARENT) {
      userExistsForQuiz = await ParentChildTable.findOne({
        userId: userIfExists._id,
      }).populate("firstChildId", [
        "_id",
        "preLoadedCoins",
        "isGiftedCrypto",
        "isParentFirst",
        "firstName",
        "lastName",
        "email",
      ]);
      isParentOrChild = userExistsForQuiz ? 1 : 0;
      preLoadedCoins = userExistsForQuiz
        ? userExistsForQuiz.firstChildId.preLoadedCoins
        : 0;
    } else {
      userExistsForQuiz = await ParentChildTable.findOne({
        $or: [
          { firstChildId: userIfExists._id },
          {
            "teens.childId": userIfExists._id,
          },
        ],
      }).populate("userId", [
        "_id",
        "preLoadedCoins",
        "firstName",
        "lastName",
        "isGiftedCrypto",
        "isParentFirst",
        "email",
      ]);
      isParentOrChild = userExistsForQuiz ? 2 : 0;
      preLoadedCoins = userExistsForQuiz ? userIfExists.preLoadedCoins : 0;
    }
    const checkQuizExists = await quizService.checkQuizExists({
      $or: [
        { userId: new mongoose.Types.ObjectId(userIfExists._id) },
        {
          userId: userExistsForQuiz
            ? userIfExists.type == EUserType.PARENT
              ? new mongoose.Types.ObjectId(userExistsForQuiz.firstChildId._id)
              : new mongoose.Types.ObjectId(userExistsForQuiz.userId._id)
            : null,
        },
      ],
      isOnBoardingQuiz: false,
    });
    let stackCoins = 0;
    if (checkQuizExists.length > 0) {
      stackCoins = checkQuizExists[0].sum;
    }
    stackCoins = stackCoins + preLoadedCoins;
    /**
     * Added Quiz information to zoho crm
     */
    let allQuizData: any = await QuizResult.find({
      userId: userId,
    }).populate("quizId");
    let quizDataAddInCrm = [];
    if (allQuizData.length > 0) {
      quizDataAddInCrm = allQuizData.map((res) => {
        return {
          Quiz_Number: parseInt(res.quizId.quizName.split(" ")[1]),
          Points: res.pointsEarned,
        };
      });
    }
    let dataSentInCrm: any = [
      {
        Account_Name: userIfExists.firstName + " " + userIfExists.lastName,
        Stack_Coins: stackCoins,
        Quiz_Information: quizDataAddInCrm,
        Email: userIfExists.email,
      },
    ];
    if (isParentOrChild != 0) {
      isParentOrChild == 2
        ? dataSentInCrm.push({
            Account_Name:
              userExistsForQuiz.userId.firstName +
              " " +
              userExistsForQuiz.userId.lastName,
            Stack_Coins: stackCoins,
            Email: userExistsForQuiz.userId.email,
          })
        : dataSentInCrm.push({
            Account_Name:
              userExistsForQuiz.firstChildId.firstName +
              " " +
              userExistsForQuiz.firstChildId.lastName,
            Stack_Coins: stackCoins,
            Email: userExistsForQuiz.firstChildId.email,
          });
    }
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
}

export default new QuizDBService();
