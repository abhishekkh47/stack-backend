import Koa from "koa";
import mongoose from "mongoose";
import {get72HoursAhead, Route} from "@app/utility";
import BaseController from "./base";
// const mongodb = require("mongodb");
// const ObjectId = mongodb.ObjectId;
import { Auth } from "@app/middleware";
import { ECorrectAnswer, EQuizTopicStatus, HttpMethod } from "@app/types";
import {
  QuizTopicTable,
  QuizTable,
  QuizQuestionTable,
  QuizResult,
  QuizQuestionResult,
} from "@app/model";
import { validation } from "../../../validations/apiValidation";

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

    const checkQuizExists = await QuizTable.findOne({
      _id: ctx.params.quizId,
    });
    if (!checkQuizExists) {
      return this.BadRequest(ctx, "Quiz Not Found");
    }
    const getQuiz = await QuizQuestionTable.find({ quizId: ctx.params.quizId })
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
    dataToSent.lastQuizTime = latestQuiz ? latestQuiz.createdAt : null;
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
          }).select("_id quizId text answer_array");
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
  // @Route({ path: "/add-quiz-result", method: HttpMethod.POST })
  // public async postCurrentQuizResult(ctx: any) {
  //   const reqParam = ctx.request.body;
  //   validation.getUserQuizDataValidation(reqParam, ctx, (validate) => {
  //     if (validate) {
  //     }
  //   });
  // }

  /**
   * @description This method is used to give list of quiz
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-list", method: HttpMethod.GET })
   @Auth()
  public getQuizList(ctx: any) {
    const reqParam = ctx.query;
    const User = ctx.request.user
    return validation.getQuizListValidation(
        reqParam,
        ctx,
        async (validate) => {
          if (validate) {

           const quizCheck: any = await QuizResult.findOne({
             userId: User._id,
             topicId: reqParam.topicId,
           }).sort({ "createdAt": -1})
           if(quizCheck !== null){
              const Time = await get72HoursAhead(quizCheck.createdAt);
              if(Time < 72){
                return this.BadRequest(ctx, "You Cannot play quiz until next 72 hours from previous round.");
              } else{
                const quizCheckCompleted = await QuizResult.find({
                  userId: User._id,
                  topicId: reqParam.topicId,
                }).select('quizId')
                const QuizIds = [];
                for(const quizId of quizCheckCompleted){
                  QuizIds.push(quizId._id)
                }
                const Data = await QuizTable.find({
                  topicId: reqParam.topicId,
                  _id:{"$ne": QuizIds}
                })
                return this.Ok(ctx, {Data, message: "Success" });
              }
           }
            this.Ok(ctx, { data: [], message: "Success" });
          }
        }
    );
  }

}

export default new QuizController();
