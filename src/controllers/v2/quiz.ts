import { validations } from "../../validations/v2/apiValidation";
import { QuizQuestionTable } from "../../model/quizQuestion";
import { QuizTable } from "../../model/quiz";
import { get72HoursAhead, getQuizHours } from "../../utility/common";
import moment from "moment";
import mongoose from "mongoose";
import { Auth } from "../../middleware";
import {
  ParentChildTable,
  QuizQuestionResult,
  QuizResult,
  UserTable,
} from "../../model";
import { quizService } from "../../services/v1/index";
import { EUserType, HttpMethod } from "../../types";
import { Route } from "../../utility";
import BaseController from "../base";

class QuizController extends BaseController {
  /**
   * @description This method is used to get user's quiz data
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-result", method: HttpMethod.POST })
  @Auth()
  public async getQuizInformation(ctx: any) {
    const user = ctx.request.user;
    let userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      userExists = await UserTable.findOne({
        _id: ctx.request.body.userId,
      });
    }
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
    const checkQuizExists = await quizService.checkQuizExists({
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
    });
    const dataToSent = {
      lastQuizTime: null,
      totalQuestionSolved: 0,
      totalStackPointsEarned: 0,
      totalStackPointsEarnedTop:
        userExists.type == EUserType.PARENT && childExists
          ? childExists.firstChildId
            ? childExists.firstChildId.preLoadedCoins
              ? childExists.firstChildId.preLoadedCoins
              : 0
            : 0
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
  @Route({ path: "/question-list", method: HttpMethod.POST })
  @Auth()
  public getQuestionList(ctx: any) {
    const reqParam = ctx.request.body;
    const user = ctx.request.user;
    const headers = ctx.request.headers;
    return validations.getUserQuizDataValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const quizCheck: any = await QuizResult.findOne({
            userId: ctx.request.body.userId
              ? ctx.request.body.userId
              : user._id,
            topicId: reqParam.topicId,
          }).sort({ createdAt: -1 });
          const quizIds: any = [];
          if (quizCheck !== null) {
            const Time = await get72HoursAhead(quizCheck.createdAt);
            const timeBetweenTwoQuiz = await getQuizHours(headers);
            if (Time < timeBetweenTwoQuiz) {
              return this.BadRequest(
                ctx,
                `Quiz is locked. Please wait for ${timeBetweenTwoQuiz} hours to unlock this quiz`
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
   * @description This method is used to get the list of onBoarding quiz questions
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/onboarding-quiz-question", method: HttpMethod.GET })
  @Auth()
  public async getOnboardingQuestionList(ctx: any) {
    const onboardingQuestionData = await QuizQuestionTable.find(
      { isOnboardingFlowQuiz: true },
      { _id: 0, points: 1, answer_array: 1, text: 1 }
    );

    return this.Ok(ctx, { data: onboardingQuestionData });
  }
}

export default new QuizController();
