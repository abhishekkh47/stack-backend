import Koa from "koa";

import { Route } from "@app/utility";
import BaseController from "./base";
import { Auth } from "@app/middleware";
import { EQuizTopicStatus, HttpMethod } from "@app/types";
import { QuizTopicTable, QuizTable } from "@app/model";

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
  @Route( { path: "/quiz", method: HttpMethod.POST },)
   @Auth()
  public async createQuiz(ctx: Koa.Context) {


    await QuizTable.create(
      ctx.request.body
    );

    return this.Created(ctx, {
      quizName: ctx.request.body.quizName,
      topicId: ctx.request.body.topicId,
      points: ctx.request.body.points,
      videoUrl: ctx.request.body.videoUrl,
      message: "Quiz Created Successfully",
    });
  }
}

export default new QuizController();
