import Koa from "koa";
import moment from "moment";
import mongoose from "mongoose";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import {
  ParentChildTable,
  QuizQuestionResult,
  QuizQuestionTable,
  QuizResult,
  QuizTable,
  QuizTopicTable,
  UserTable,
} from "../../../model";
import { zohoCrmService } from "../../../services";
import {
  EQuizTopicStatus,
  EUserType,
  everyCorrectAnswerPoints,
  HttpMethod,
  timeBetweenTwoQuiz,
} from "../../../types";
import { get72HoursAhead, Route } from "../../../utility";
import { validation } from "../../../validations/apiValidation";
import BaseController from "./base";

class QuizController extends BaseController {
  /**
   * @description This method is user to get all the quiz topics
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/quiz-topics", method: HttpMethod.GET })
  @Auth()
  public async getQuizTopics(ctx: Koa.Context) {
    const quizTopics = await QuizTopicTable.find({
      status: EQuizTopicStatus.ACTIVE,
    })
      .sort({
        createdAt: -1,
      })
      .select("_id topic status");
    return this.Ok(ctx, {
      data: quizTopics,
      count: quizTopics.length,
    });
  }

  /**
   * @description This method is user to create multiple quiz topics
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/quiz-topics", method: HttpMethod.POST })
  @Auth()
  public async addQuizTopics(ctx: Koa.Context) {
    if (!ctx.request.body.topic) {
      return this.BadRequest(ctx, "Please Enter Topic Name");
    }
    const checkQuizTopicExists = await QuizTopicTable.findOne({
      topic: ctx.request.body.topic,
    });
    if (checkQuizTopicExists) {
      return this.BadRequest(
        ctx,
        `Topic name ${ctx.request.body.topic} already exists`
      );
    }

    await QuizTopicTable.create({
      topic: ctx.request.body.topic,
    });

    return this.Created(ctx, {
      topic: ctx.request.body.topic,
      message: "Quiz Topic Created Successfully",
    });
  }

  /**
   * @description This method is user to create quiz
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/quiz", method: HttpMethod.POST })
  // @Auth()
  public async createQuiz(ctx: Koa.Context) {
    await QuizTable.create(ctx.request.body);

    return this.Created(ctx, {
      quizName: ctx.request.body.quizName,
      topicId: ctx.request.body.topicId,
      points: ctx.request.body.points,
      videoUrl: ctx.request.body.videoUrl,
      message: "Quiz Created Successfully",
    });
  }

  /**
   * @description This method is user to create question based on an individual quiz
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/quiz-question", method: HttpMethod.POST })
  // @Auth()
  public async createQuizQuestion(ctx: Koa.Context) {
    await QuizQuestionTable.create(ctx.request.body);

    return this.Created(ctx, {
      message: "Quiz Question Created Successfully",
      // data: main,
    });
  }

  /**
   * @description This method is used to get user's quiz data
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-result", method: HttpMethod.GET })
  @Auth()
  public async getQuizInformation(ctx: any) {
    const user = ctx.request.user;
    let userExists = await UserTable.findOne({ _id: user._id });
    let childExists = null;
    if (userExists.type == EUserType.PARENT) {
      childExists = await ParentChildTable.findOne({
        userId: userExists._id,
      }).populate("firstChildId", ["_id", "preLoadedCoins"]);
    } else {
      childExists = await ParentChildTable.findOne({
        firstChildId: userExists._id,
      }).populate("userId", ["_id", "preLoadedCoins"]);
    }
    const checkQuizExists = await QuizResult.aggregate([
      {
        $match: {
          $or: [
            { userId: new mongoose.Types.ObjectId(user._id) },
            {
              userId: childExists
                ? userExists.type == EUserType.PARENT
                  ? new mongoose.Types.ObjectId(childExists.userId._id)
                  : new mongoose.Types.ObjectId(childExists.firstChildId._id)
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
    const dataToSent = {
      lastQuizTime: null,
      totalQuestionSolved: 0,
      totalStackPointsEarned: 0,
      totalStackPointsEarnedTop:
        userExists.type == EUserType.PARENT && childExists
          ? childExists.firstChildId.preLoadedCoins
          : userExists.type == EUserType.TEEN
          ? userExists.preLoadedCoins
          : 0,
    };
    /**
     * Get Stack Point Earned
     */
    if (checkQuizExists.length > 0) {
      dataToSent.totalStackPointsEarned += checkQuizExists[0].sum;
    }
    const newQuizData = await QuizResult.aggregate([
      {
        $match: {
          $or: [
            { userId: new mongoose.Types.ObjectId(user._id) },
            {
              userId: childExists
                ? userExists.type == EUserType.PARENT
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
    if (newQuizData.length > 0) {
      dataToSent.totalStackPointsEarnedTop += newQuizData[0].sum;
    }

    /**
     * Get Quiz Question Count
     */
    const getQuizQuestionsCount = await QuizQuestionResult.countDocuments({
      userId: user._id,
    });
    dataToSent.totalQuestionSolved =
      checkQuizExists.length > 0 ? getQuizQuestionsCount : 0;
    /**
     * Get Latest Quiz Time
     */
    const latestQuiz = await QuizResult.findOne({ userId: user._id }).sort({
      createdAt: -1,
    });
    dataToSent.lastQuizTime = latestQuiz
      ? moment(latestQuiz.createdAt).unix()
      : null;
    return this.Ok(ctx, dataToSent);
  }

  /**
   * @description This method is used to give question list based on quiz
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/question-list/:topicId", method: HttpMethod.GET })
  @Auth()
  public getQuestionList(ctx: any) {
    const reqParam = ctx.params;
    const user = ctx.request.user;
    return validation.getUserQuizDataValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const quizCheck: any = await QuizResult.findOne({
            userId: user._id,
            topicId: reqParam.topicId,
          }).sort({ createdAt: -1 });
          const quizIds: any = [];
          if (quizCheck !== null) {
            const Time = await get72HoursAhead(quizCheck.createdAt);
            if (Time < timeBetweenTwoQuiz) {
              return this.BadRequest(
                ctx,
                "Quiz is locked. Please wait for 72 hours to unlock this quiz."
              );
            }
          }
          const quizCheckCompleted = await QuizResult.find(
            {
              userId: user._id,
              topicId: reqParam.topicId,
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
            topicId: reqParam.topicId,
            _id: { $nin: quizIds },
          }).sort({ createdAt: 1 });
          if (!data) {
            return this.BadRequest(ctx, "Quiz Not Found");
          }
          const quizQuestionList = await QuizQuestionTable.find({
            quizId: data._id,
          }).select(
            "_id quizId text answer_array points question_image question_type answer_type"
          );
          return this.Ok(ctx, { quizQuestionList, message: "Success" });
        }
      }
    );
  }

  /**
   * @description This method is used to post current quiz results
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/add-quiz-result", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public postCurrentQuizResult(ctx: any) {
    const reqParam = ctx.request.body;
    const user = ctx.request.user;
    return validation.addQuizResultValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const userExists = await UserTable.findOne({ _id: user._id });
          const quizExists = await QuizTable.findOne({ _id: reqParam.quizId });
          if (!quizExists) {
            return this.BadRequest(ctx, "Quiz Details Doesn't Exists");
          }
          const quizResultExists = await QuizResult.findOne({
            userId: user._id,
            quizId: reqParam.quizId,
          });
          if (quizResultExists) {
            return this.BadRequest(
              ctx,
              "You cannot submit the same quiz again"
            );
          }
          const lastQuizPlayed = await QuizResult.findOne({
            userId: user._id,
          }).sort({ createdAt: -1 });
          if (lastQuizPlayed) {
            const timeDiff = await get72HoursAhead(lastQuizPlayed.createdAt);
            if (timeDiff <= timeBetweenTwoQuiz) {
              return this.BadRequest(
                ctx,
                "Quiz is locked. Please wait for 72 hours to unlock this quiz"
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
                userId: user._id,
                quizQuestionId: solvedQue,
                pointsEarned: queExists.points,
              });
            }
          }
          if (queExistsFlag === false) {
            return this.BadRequest(ctx, "Question Doesn't Exists in db");
          }
          /**
           * Add Question Result and Quiz Result
           */
          await QuizQuestionResult.insertMany(quizQuestions);
          const dataToCreate = {
            topicId: quizExists.topicId,
            quizId: quizExists._id,
            userId: user._id,
            pointsEarned:
              everyCorrectAnswerPoints * reqParam.solvedQuestions.length,
          };
          await QuizResult.create(dataToCreate);
          let userExistsForQuiz = null;
          let preLoadedCoins = 0;
          let isParentOrChild = 0;
          if (userExists.type == EUserType.PARENT) {
            userExistsForQuiz = await ParentChildTable.findOne({
              userId: userExists._id,
            }).populate("firstChildId", [
              "_id",
              "preLoadedCoins",
              "isGiftedCrypto",
              "isParentFirst",
              "firstName",
              "lastName",
            ]);
            isParentOrChild = userExistsForQuiz ? 1 : 0;
            preLoadedCoins = userExistsForQuiz
              ? userExistsForQuiz.firstChildId.preLoadedCoins
              : 0;
          } else {
            userExistsForQuiz = await ParentChildTable.findOne({
              firstChildId: userExists._id,
            }).populate("userId", [
              "_id",
              "preLoadedCoins",
              "firstName",
              "lastName",
              "isGiftedCrypto",
              "isParentFirst",
            ]);
            isParentOrChild = userExistsForQuiz ? 2 : 0;
            preLoadedCoins = userExistsForQuiz ? userExists.preLoadedCoins : 0;
          }
          const checkQuizExists = await QuizResult.aggregate([
            {
              $match: {
                $or: [
                  { userId: new mongoose.Types.ObjectId(userExists._id) },
                  {
                    userId: userExistsForQuiz
                      ? userExists.type == EUserType.PARENT
                        ? new mongoose.Types.ObjectId(
                            userExistsForQuiz.firstChildId._id
                          )
                        : new mongoose.Types.ObjectId(
                            userExistsForQuiz.userId._id
                          )
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
          let stackCoins = 0;
          if (checkQuizExists.length > 0) {
            stackCoins = checkQuizExists[0].sum;
          }
          stackCoins = stackCoins + preLoadedCoins;
          /**
           * Added Quiz information to zoho crm
           */
          let dataSentInCrm: any = [
            {
              Account_Name: userExists.firstName + " " + userExists.lastName,
              Stack_Coins: stackCoins,
              Quiz_Information: [
                {
                  Quiz_Number: parseInt(quizExists.quizName.split(" ")[1]),
                  Points:
                    everyCorrectAnswerPoints * reqParam.solvedQuestions.length,
                },
              ],
            },
          ];
          console.log(isParentOrChild, "isParentOrChild");
          if (isParentOrChild != 0) {
            isParentOrChild == 2
              ? dataSentInCrm.push({
                  Account_Name:
                    userExistsForQuiz.userId.firstName +
                    " " +
                    userExistsForQuiz.userId.lastName,
                  Stack_Coins: stackCoins,
                })
              : dataSentInCrm.push({
                  Account_Name:
                    userExistsForQuiz.firstChildId.firstName +
                    " " +
                    userExistsForQuiz.firstChildId.lastName,
                  Stack_Coins: stackCoins,
                });
          }
          await zohoCrmService.addAccounts(
            ctx.request.zohoAccessToken,
            dataSentInCrm,
            true
          );
          return this.Ok(ctx, { message: "Quiz Results Stored Successfully" });
        }
      }
    );
  }

  /**
   * @description This method is used to give list of quiz
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-list/:topicId", method: HttpMethod.GET })
  @Auth()
  public getQuizList(ctx: any) {
    const reqParam = ctx.params;
    const user = ctx.request.user;
    return validation.getQuizListValidation(reqParam, ctx, async (validate) => {
      if (validate) {
        const quizCheck: any = await QuizResult.findOne({
          userId: user._id,
          topicId: reqParam.topicId,
        }).sort({ createdAt: -1 });
        const QuizIds = [];
        if (quizCheck !== null) {
          const Time = await get72HoursAhead(quizCheck.createdAt);
          if (Time < timeBetweenTwoQuiz) {
            return this.BadRequest(
              ctx,
              "Quiz is locked. Please wait for 72 hours to unlock this quiz."
            );
          } else {
            const quizCheckCompleted = await QuizResult.find(
              {
                userId: user._id,
                topicId: reqParam.topicId,
              },
              {
                _id: 0,
                quizId: 1,
              }
            ).select("quizId");
            for (const quizId of quizCheckCompleted) {
              QuizIds.push(quizId.quizId);
            }
          }
        }
        const data = await QuizTable.find({
          topicId: reqParam.topicId,
          _id: { $nin: QuizIds },
        });
        return this.Ok(ctx, { data, message: "Success" });
      }
    });
  }
}

export default new QuizController();
