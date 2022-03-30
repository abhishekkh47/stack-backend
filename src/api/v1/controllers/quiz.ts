import Koa from "koa";
import mongoose from "mongoose";
import { get72HoursAhead, Route } from "@app/utility";
import BaseController from "./base";
import { Auth } from "@app/middleware";
import {
  EQuizTopicStatus,
  everyCorrectAnswerPoints,
  HttpMethod,
  timeBetweenTwoQuiz,
} from "@app/types";
import {
  QuizTopicTable,
  QuizTable,
  QuizQuestionTable,
  QuizResult,
  QuizQuestionResult,
} from "@app/model";
import { validation } from "../../../validations/apiValidation";
import moment from "moment";

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
  @Auth()
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
  @Auth()
  public async createQuizQuestion(ctx: Koa.Context) {
    await QuizQuestionTable.create(ctx.request.body);

    return this.Created(ctx, {
      message: "Quiz Question Created Successfully",
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
    const checkQuizExists = await QuizResult.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user._id),
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
    };
    /**
     * Get Stack Point Earned
     */
    if (checkQuizExists.length > 0) {
      dataToSent.totalStackPointsEarned = checkQuizExists[0].sum;
    }
    /**
     * Get Quiz Question Count
     */
    const getQuizQuestionsCount = await QuizQuestionResult.countDocuments({
      user_id: user._id,
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
  @Route({ path: "/question-list/:quizId", method: HttpMethod.GET })
  @Auth()
  public getQuestionList(ctx: any) {
    const reqParam = ctx.params;
    return validation.getUserQuizDataValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const quizQuestionList = await QuizQuestionTable.find({
            quizId: reqParam.quizId,
          }).select("_id quizId text answer_array points");
          this.Ok(ctx, { quizQuestionList, message: "Success" });
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
  public postCurrentQuizResult(ctx: any) {
    const reqParam = ctx.request.body;
    const user = ctx.request.user;
    return validation.addQuizResultValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
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
        const Data = await QuizTable.find({
          topicId: reqParam.topicId,
          _id: { $nin: QuizIds },
        });
        return this.Ok(ctx, { Data, message: "Success" });
      }
    });
  }
}

export default new QuizController();
