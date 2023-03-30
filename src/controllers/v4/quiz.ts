import { PrimeTrustJWT } from "./../../middleware/primeTrust.middleware";
import { validationsV3 } from "./../../validations/v3/apiValidation";
import { validationsV4 } from "./../../validations/v4/apiValidation";
import { validation } from "./../../validations/v1/apiValidation";
import { EUserType } from "./../../types/user";
import {
  UserTable,
  QuizQuestionTable,
  QuizQuestionResult,
  QuizTable,
  QuizResult,
  ParentChildTable,
  QuizTopicTable,
  AdminTable,
} from "../../model";
import { Auth } from "../../middleware";
import { everyCorrectAnswerPoints, HttpMethod } from "../../types";
import {
  get72HoursAhead,
  getQuizCooldown,
  Route,
  getQuizImageAspectRatio,
} from "../../utility";
import BaseController from "../base";
import { quizService, zohoCrmService } from "../../services/v1";
import mongoose from "mongoose";
import moment from "moment";
import { QuizDBService } from "../../services/v4";

class QuizController extends BaseController {
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
      return this.BadRequest(ctx, "User not found");
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
    const { user, headers } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) {
      return this.BadRequest(ctx, "User not found");
    }
    let childExists = null;
    if (userIfExists.type == EUserType.PARENT) {
      childExists = await ParentChildTable.findOne({
        userId: userIfExists._id,
      }).populate("firstChildId", ["_id", "preLoadedCoins"]);
    } else {
      childExists = await ParentChildTable.findOne({
        firstChildId: userIfExists._id,
      }).populate("userId", ["_id", "preLoadedCoins"]);
    }
    const checkQuizExists = await quizService.checkQuizExists({
      $or: [
        { userId: new mongoose.Types.ObjectId(user._id) },
        {
          userId: childExists
            ? userIfExists.type == EUserType.PARENT
              ? new mongoose.Types.ObjectId(childExists.userId._id)
              : new mongoose.Types.ObjectId(childExists.firstChildId._id)
            : null,
        },
      ],
      isOnBoardingQuiz: false,
    });
    const dataToSent = {
      quizCooldown: 0,
      lastQuizTime: null,
      totalQuestionSolved: 0,
      totalStackPointsEarned: 0,
      totalStackPointsEarnedTop:
        userIfExists.type == EUserType.PARENT && childExists
          ? childExists.firstChildId
            ? childExists.firstChildId.preLoadedCoins
              ? childExists.firstChildId.preLoadedCoins
              : 0
            : 0
          : userIfExists.type == EUserType.TEEN
          ? userIfExists.preLoadedCoins
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
    dataToSent.quizCooldown = await getQuizCooldown(headers);
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
    const { user, headers } = ctx.request;
    return validation.addQuizResultValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          let userIfExists = await UserTable.findOne({ _id: user._id });
          if (!userIfExists) {
            return this.BadRequest(ctx, "User Not Found");
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
          const quizCooldown = await getQuizCooldown(headers);
          if (lastQuizPlayed) {
            const timeDiff = await get72HoursAhead(lastQuizPlayed.createdAt);
            if (timeDiff <= quizCooldown) {
              return this.BadRequest(
                ctx,
                `Quiz is locked. Please wait for ${quizCooldown} hours to unlock this quiz`
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
            preLoadedCoins = userExistsForQuiz
              ? userIfExists.preLoadedCoins
              : 0;
          }
          const checkQuizExists = await quizService.checkQuizExists({
            $or: [
              { userId: new mongoose.Types.ObjectId(userIfExists._id) },
              {
                userId: userExistsForQuiz
                  ? userIfExists.type == EUserType.PARENT
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
              Account_Name:
                userIfExists.firstName + " " + userIfExists.lastName,
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
   * @description This method is used to get user's quiz data
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-result/me", method: HttpMethod.GET })
  @Auth()
  public async getQuizResultsInformation(ctx: any) {
    const { user, headers } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) {
      return this.BadRequest(ctx, "User not found");
    }
    let childExists = null;
    if (userIfExists.type == EUserType.PARENT) {
      childExists = await ParentChildTable.findOne({
        userId: userIfExists._id,
      }).populate("firstChildId", ["_id", "preLoadedCoins"]);
    } else {
      childExists = await ParentChildTable.findOne({
        firstChildId: userIfExists._id,
      }).populate("userId", ["_id", "preLoadedCoins"]);
    }
    const checkQuizExists = await quizService.checkQuizExists({
      $or: [
        { userId: new mongoose.Types.ObjectId(user._id) },
        {
          userId: childExists
            ? userIfExists.type == EUserType.PARENT
              ? new mongoose.Types.ObjectId(childExists.userId._id)
              : new mongoose.Types.ObjectId(childExists.firstChildId._id)
            : null,
        },
      ],
      isOnBoardingQuiz: false,
    });
    const dataToSent = {
      quizCooldown: 0,
      lastQuizTime: null,
      totalQuestionSolved: 0,
      totalStackPointsEarned: 0,
      totalStackPointsEarnedTop:
        userIfExists.type == EUserType.PARENT && childExists
          ? childExists.firstChildId
            ? childExists.firstChildId.preLoadedCoins
              ? childExists.firstChildId.preLoadedCoins
              : 0
            : 0
          : userIfExists.type == EUserType.TEEN
          ? userIfExists.preLoadedCoins
          : 0,
    };
    /**
     * Get Stack Point Earned
     */
    if (checkQuizExists.length > 0) {
      dataToSent.totalStackPointsEarned += checkQuizExists[0].sum;
    }
    const totalStackCoins = await QuizDBService.getTotalCoinsFromQuiz(
      user._id,
      childExists,
      userIfExists
    );
    dataToSent.totalStackPointsEarnedTop += totalStackCoins;

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
    dataToSent.quizCooldown = await getQuizCooldown(headers);
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
  @Route({ path: "/quiz-results", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public storeQuizResults(ctx: any) {
    const reqParam = ctx.request.body;
    const { user, headers } = ctx.request;
    return validation.addQuizResultValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          let userIfExists = await UserTable.findOne({ _id: user._id });
          if (!userIfExists) {
            return this.BadRequest(ctx, "User Not Found");
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
          const isTeen = userIfExists.type === EUserType.TEEN ? true : false;
          await QuizDBService.storeQuizInformation(
            user._id,
            headers,
            reqParam,
            quizExists,
            isTeen
          );
          const dataSentInCrm = await QuizDBService.getQuizDataToSentInCrm(
            userIfExists,
            user._id
          );
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
   * @description This method is used to give question list based on quiz
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/question-list", method: HttpMethod.POST })
  @Auth()
  public getQuestionList(ctx: any) {
    const reqParam = ctx.request.body;
    const { user, headers } = ctx.request;
    return validationsV4.getUserQuizDataValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const quizQuestionList = await QuizDBService.getQuizQuestionList(
            user,
            reqParam.topicId,
            headers
          );
          const quizImageAspectRatio = await getQuizImageAspectRatio(headers);
          return this.Ok(ctx, {
            quizQuestionList,
            message: "Success",
            quizImageAspectRatio,
          });
        }
      }
    );
  }

  /**
   * @description This method is used to give quiz questions based on quiz
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-questions/:quizId", method: HttpMethod.GET })
  @Auth()
  public async getQuizQuestions(ctx: any) {
    const { user, headers, params } = ctx.request;
    if (!params.quizId) {
      return this.BadRequest(ctx, "Quiz not found");
    }
    const quizQuestionList = await QuizDBService.getQuizQuestions(
      user,
      params.quizId,
      headers
    );
    const quizImageAspectRatio = await getQuizImageAspectRatio(headers);
    return this.Ok(ctx, {
      quizQuestionList,
      message: "Success",
      quizImageAspectRatio,
    });
  }

  /**
   * @description This method is used to give quiz topics available or disabled based on user's last quiz
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quizzes", method: HttpMethod.GET })
  @Auth()
  public async getQuiz(ctx: any) {
    try {
      const user = await UserTable.findOne({ _id: ctx.request.user._id });
      if (!user) {
        return this.BadRequest(ctx, "User not found");
      }
      const quizResult = await QuizResult.find({
        userId: user._id,
      });
      let quizIds = [];
      if (quizResult.length > 0) {
        quizIds = quizResult.map((x) => x.quizId);
      }
      const quizInformation = await QuizDBService.getQuizData(quizIds);
      return this.Ok(ctx, { data: quizInformation });
    } catch (error) {
      return this.BadRequest(ctx, "Something Went Wrong");
    }
  }
}

export default new QuizController();
