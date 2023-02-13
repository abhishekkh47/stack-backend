import { PrimeTrustJWT } from "./../../middleware/primeTrust.middleware";
import { validationsV3 } from "./../../validations/v3/apiValidation";
import { EUserType } from "./../../types/user";
import {
  UserTable,
  QuizQuestionTable,
  QuizQuestionResult,
  QuizTable,
  QuizResult,
  ParentChildTable,
} from "../../model";
import { Auth } from "../../middleware";
import { HttpMethod } from "../../types";
import { Route } from "../../utility";
import BaseController from "../base";
import { quizService, zohoCrmService } from "../../services/v1";
import mongoose from "mongoose";
import moment from "moment";

class QuizController extends BaseController {
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
      {
        _id: 1,
        points: 1,
        answer_array: 1,
        text: 1,
        question_type: 1,
        answer_type: 1,
        question_image: 1,
        question_image_title: 1,
        quizId: 1,
      }
    );

    return this.Ok(ctx, { data: onboardingQuestionData });
  }

  /**
   * @description This method is used to store quiz result
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/add-onboarding-quiz-result", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async getOnboardingQuizResult(ctx: any) {
    const reqParam = ctx.request.body;
    const checkUserExists = await UserTable.findOne({
      _id: ctx.request.user._id,
    });
    if (!checkUserExists) {
      this.BadRequest(ctx, "User not found");
    }
    const checkQuizExists = await QuizTable.findOne({
      _id: reqParam.quizId,
    });

    if (!checkQuizExists) {
      this.BadRequest(ctx, "Quiz does not exist");
    }
    return validationsV3.addQuizResultValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          if (checkUserExists.type == EUserType.TEEN) {
            const dataToCreate = {
              topicId: checkQuizExists.topicId,
              quizId: checkQuizExists._id,
              userId: checkUserExists._id,
              pointsEarned: reqParam.pointsEarned,
              isOnBoardingQuiz: true,
            };
            await QuizResult.create(dataToCreate);
            await UserTable.updateOne(
              { _id: checkUserExists._id },
              {
                $inc: {
                  quizCoins: reqParam.pointsEarned,
                },
              }
            );

            let allQuizData: any = await QuizResult.find({
              userId: checkUserExists._id,
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

            const stackCoins =
              checkUserExists.quizCoins + checkUserExists.preLoadedCoins;
            let dataSentInCrm: any = [
              {
                Account_Name:
                  checkUserExists.firstName + " " + checkUserExists.lastName,
                Stack_Coins: stackCoins,
                Quiz_Information: quizDataAddInCrm,
                Email: checkUserExists.email,
              },
            ];

            await zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataSentInCrm,
              true
            );
            return this.Ok(ctx, { message: "Success" });
          } else {
            this.BadRequest(ctx, "Only available for below 18 users.");
          }
        }
      }
    );
  }

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
      isOnBoardingQuiz: false,
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
    const latestQuiz = await QuizResult.findOne({
      userId: user._id,
      isOnBoardingQuiz: false,
    }).sort({
      createdAt: -1,
    });
    dataToSent.lastQuizTime = latestQuiz
      ? moment(latestQuiz.createdAt).unix()
      : null;
    return this.Ok(ctx, dataToSent);
  }
}

export default new QuizController();
