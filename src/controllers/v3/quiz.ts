import { PrimeTrustJWT } from "./../../middleware/primeTrust.middleware";
import { validationsV3 } from "./../../validations/v3/apiValidation";
import { QuizResult } from "./../../model/quizResult";
import { QuizTable } from "./../../model/quiz";
import { EUserType } from "./../../types/user";
import { UserTable } from "./../../model/user";
import { QuizQuestionTable } from "../../model/quizQuestion";
import { Auth } from "../../middleware";
import { HttpMethod } from "../../types";
import { Route } from "../../utility";
import BaseController from "../base";
import { zohoCrmService } from "@app/services/v1";

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
}

export default new QuizController();
