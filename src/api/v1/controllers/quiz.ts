import Koa from "koa";
import mongoose from "mongoose";
import { Route } from "@app/utility";
import BaseController from "./base";
const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectId;
import { Auth } from "@app/middleware";
import { ECorrectAnswer, EQuizTopicStatus, HttpMethod } from "@app/types";
import {
  QuizTopicTable,
  QuizTable,
  QuizQuestionTable,
  QuizResult,
  QuizQuestionResult,
} from "@app/model";

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
    ctx.request.body.date_of_answer = new Date();
    await QuizQuestionTable.create(ctx.request.body);

    return this.Created(ctx, {
      message: "Quiz Question Created Successfully",
    });
  }

  /**
   * @description This method is used to get question of any indivual quiz
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-question/:quizId", method: HttpMethod.GET })
  @Auth()
  public async getQuizQuestions(ctx: Koa.Context) {
    if (!ctx.params.quizId) {
      return this.BadRequest(ctx, "Quiz Detail Not Found");
    }

    let checkQuizExists = await QuizTable.findOne({
      _id: ctx.params.quizId,
    });
    if (!checkQuizExists) {
      return this.BadRequest(ctx, "Quiz Not Found");
    }
    let getQuiz = await QuizQuestionTable.find({ quizId: ctx.params.quizId })
      .select("_id text answer_array quizId")
      .limit(5)
      .sort({ createdAt: 1 });
    return this.Ok(ctx, getQuiz);
  }

  /**
   * @description This method is used to get user's quiz data
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-data", method: HttpMethod.GET })
  @Auth()
  public async getQuizInformation(ctx: any) {
    const user = ctx.request.user;
    let checkQuizExists = await QuizResult.aggregate([
      {
        $match: {
          userId: ObjectId(user._id),
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
    let dataToSent = {
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
    let getQuizQuestionsCount = await QuizQuestionResult.countDocuments({
      user_id: user._id,
      correct_answer: ECorrectAnswer.TRUE,
    });
    dataToSent.totalQuestionSolved = getQuizQuestionsCount;
    /**
     * Get Latest Quiz Time
     */
    let latestQuiz = await QuizResult.findOne({ userId: user._id }).sort({
      createdAt: -1,
    });
    dataToSent.lastQuizTime = latestQuiz ? latestQuiz.createdAt : null;
    return this.Ok(ctx, dataToSent);
  }

  // /**
  //  * @description This method is used to post current quiz results
  //  * @param ctx
  //  * @return {*}
  //  */
  // @Route({ path: "/add-quiz-result", method: HttpMethod.POST })
  // public async postCurrentQuizResult(ctx: any) {
  //   const user = ctx.request.user;
  //   if (!ctx.request.quizId) {
  //     return this.BadRequest(ctx, "Quiz Detail Not Found");
  //   }
  //   if (ctx.request.solvedQuestionId) {
  //   }
  // }
}

export default new QuizController();
