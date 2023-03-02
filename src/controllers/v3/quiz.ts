import { PrimeTrustJWT } from "./../../middleware/primeTrust.middleware";
import { validationsV3 } from "./../../validations/v3/apiValidation";
import { validation } from "./../../validations/v1/apiValidation";
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
import {
  everyCorrectAnswerPoints,
  HttpMethod,
  timeBetweenTwoQuiz,
} from "../../types";
import { get72HoursAhead, Route } from "../../utility";
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
    let checkUserExists = await UserTable.findOne({
      _id: ctx.request.user._id,
    });
    if (!checkUserExists) {
      checkUserExists = await UserTable.findOne({
        _id: ctx.request.body.userId,
      });
      if (!checkUserExists) {
        return this.BadRequest(ctx, "User not found");
      }
    }
    if (checkUserExists.isOnboardingQuizCompleted === true) {
      return this.BadRequest(ctx, "Onboaring quiz already played");
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
                $set: {
                  isOnboardingQuizCompleted: true,
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
          let userExists = await UserTable.findOne({ _id: user._id });
          if (!userExists && reqParam.userId) {
            userExists = await UserTable.findOne({ _id: reqParam.userId });
            if (!userExists) {
              return this.BadRequest(ctx, "User Not Found");
            }
          }
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
            isOnBoardingQuiz: false,
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
            isOnBoardingQuiz: false,
            pointsEarned:
              everyCorrectAnswerPoints * reqParam.solvedQuestions.length,
          };
          await QuizResult.create(dataToCreate);
          await UserTable.updateOne(
            { _id: user._id },
            {
              $inc: {
                quizCoins:
                  everyCorrectAnswerPoints * reqParam.solvedQuestions.length,
              },
            }
          );
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
              "email",
            ]);
            isParentOrChild = userExistsForQuiz ? 1 : 0;
            preLoadedCoins = userExistsForQuiz
              ? userExistsForQuiz.firstChildId.preLoadedCoins
              : 0;
          } else {
            userExistsForQuiz = await ParentChildTable.findOne({
              $or: [
                { firstChildId: userExists._id },
                {
                  "teens.childId": userExists._id,
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
            preLoadedCoins = userExistsForQuiz ? userExists.preLoadedCoins : 0;
          }
          const checkQuizExists = await quizService.checkQuizExists({
            $or: [
              { userId: new mongoose.Types.ObjectId(userExists._id) },
              {
                userId: userExistsForQuiz
                  ? userExists.type == EUserType.PARENT
                    ? new mongoose.Types.ObjectId(
                        userExistsForQuiz.firstChildId._id
                      )
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
            userId: user._id,
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
              Account_Name: userExists.firstName + " " + userExists.lastName,
              Stack_Coins: stackCoins,
              Quiz_Information: quizDataAddInCrm,
              Email: userExists.email,
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
}

export default new QuizController();
