import { Auth, NetworkError, PrimeTrustJWT } from "@app/middleware";
import {
  LeagueTable,
  ParentChildTable,
  QuizQuestionResult,
  QuizQuestionTable,
  QuizResult,
  QuizTable,
  QuizTopicTable,
  StageTable,
  UserTable,
} from "@app/model";
import { quizService, zohoCrmService } from "@app/services/v1";
import {
  AnalyticsService,
  LeagueService,
  QuizDBService,
} from "@app/services/v4";
import { everyCorrectAnswerPoints, HttpMethod, EUserType } from "@app/types";
import {
  ANALYTICS_EVENTS,
  getQuizImageAspectRatio,
  NEXT_LEAGUE_UNLOCK_IMAGE,
  QUIZ_LIMIT_REACHED_TEXT,
  Route,
} from "@app/utility";
import moment from "moment";
import mongoose from "mongoose";
import BaseController from "@app/controllers/base";
import { validation } from "@app/validations/v1/apiValidation";
import { validationsV3 } from "@app/validations/v3/apiValidation";
import { validationsV4 } from "@app/validations/v4/apiValidation";
import quizDbService from "@app/services/v4/quiz.db.service";

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
          let quizResultsData = await QuizResult.find({
            userId: user._id,
            isOnBoardingQuiz: false,
          });
          const isQuizLimitReached = await QuizDBService.checkQuizLimitReached(
            quizResultsData,
            user._id
          );
          if (isQuizLimitReached) {
            throw new NetworkError(QUIZ_LIMIT_REACHED_TEXT, 400);
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
    const checkQuizExists = await quizService.checkQuizExists({
      $or: [{ userId: new mongoose.Types.ObjectId(user._id) }],
      isOnBoardingQuiz: false,
    });
    const dataToSent = {
      quizCooldown: 0,
      lastQuizTime: null,
      totalQuestionSolved: 0,
      totalStackPointsEarned: 0,
      totalStackPointsEarnedTop: userIfExists.preLoadedCoins,
      xpPoints: 0,
    };
    /**
     * Get Stack Point Earned
     */
    // let parentCoins = childExists?.userId?.quizCoins || 0;
    dataToSent.totalStackPointsEarned += userIfExists.quizCoins;
    dataToSent.totalStackPointsEarnedTop += userIfExists.quizCoins;
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
    /* userIfExists.type == EUserType.TEEN
      ? (dataToSent.xpPoints = userIfExists.xpPoints)
      : (dataToSent.xpPoints = 0);
     */
    dataToSent.xpPoints = userIfExists.xpPoints;
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
          let leagues = await LeagueTable.find({})
            .select("_id name image minPoint maxPoint colorCode")
            .sort({ minPoint: 1 });
          let userIfExists = await UserTable.findOne({ _id: user._id });
          if (!userIfExists) {
            return this.BadRequest(ctx, "User Not Found");
          }
          const quizIfExists = await QuizTable.findOne({
            _id: reqParam.quizId,
          });
          if (!quizIfExists) {
            return this.BadRequest(ctx, "Quiz Details Doesn't Exists");
          }
          const quizResultsIfExists = await QuizResult.findOne({
            userId: user._id,
            quizId: reqParam.quizId,
          });
          if (quizResultsIfExists) {
            return this.BadRequest(
              ctx,
              "You cannot submit the same quiz again"
            );
          }
          const { totalXPPoints, updatedXPPoints } =
            await QuizDBService.storeQuizInformation(
              user._id,
              headers,
              reqParam,
              quizIfExists
            );
          const {
            previousLeague,
            currentLeague,
            nextLeague,
            isNewLeagueUnlocked,
          } = await LeagueService.getUpdatedLeagueDetailsOfUser(
            userIfExists,
            leagues,
            updatedXPPoints
          );
          const dataForCrm = await QuizDBService.getQuizDataForCrm(
            userIfExists,
            user._id,
            updatedXPPoints
          );
          await zohoCrmService.addAccounts(
            ctx.request.zohoAccessToken,
            dataForCrm,
            true
          );
          return this.Ok(ctx, {
            message: "Quiz Results Stored Successfully",
            totalXPPoints: totalXPPoints,
            updatedXPPoints,
            previousLeague,
            currentLeague,
            nextLeague,
            isNewLeagueUnlocked,
          });
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
    const { user, headers, params, query } = ctx.request;
    if (!params.quizId) {
      return this.BadRequest(ctx, "Quiz not found");
    }
    const isCompleted = JSON.parse(query?.isCompleted || null);
    const quizQuestionList = await QuizDBService.getQuizQuestions(
      user,
      params.quizId,
      headers,
      isCompleted
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
      const { categoryId, status, hasStages } = ctx.request.query; //status 1 - Start Journey and 2 - Completed
      if (hasStages) {
        const quizCategoryIfExists = await QuizTopicTable.findOne({
          hasStages: hasStages,
          _id: categoryId,
        });
        if (!quizCategoryIfExists) {
          return this.BadRequest(ctx, "Quiz Category Not Found");
        }
        const stages = await StageTable.find({}).sort({ order: 1 });
      } else {
        if (status && !["1", "2"].includes(status)) {
          return this.BadRequest(ctx, "Please enter valid status");
        }
        const user = await UserTable.findOne({ _id: ctx.request.user._id });
        if (!user) {
          return this.BadRequest(ctx, "User not found");
        }
        const quizResult = await QuizResult.find({
          userId: user._id,
          isOnBoardingQuiz: false,
        });
        let quizIds = [];
        if (quizResult.length > 0) {
          quizIds = quizResult.map((x) => x.quizId);
        }
        let completedCount: any = 0;
        if (categoryId) {
          completedCount = quizResult.filter(
            (x) => x.topicId.toString() == categoryId.toString()
          ).length;
        }
        const quizInformation = await QuizDBService.getQuizData(
          quizIds,
          categoryId,
          status
        );
        if (!categoryId) return this.Ok(ctx, { data: quizInformation });
        return this.Ok(ctx, { data: { quizInformation, completedCount } });
      }
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

  /**
   * @description This method is used to store quiz review based on quizzes played by teens
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-review", method: HttpMethod.POST })
  @Auth()
  public async storeQuizReview(ctx: any) {
    try {
      const { user, body } = ctx.request;
      const userIfExists = await UserTable.findOne({ _id: user._id });
      if (!userIfExists) {
        return this.BadRequest(ctx, "Teen not found");
      }
      return validationsV4.quizReviewValidation(body, ctx, async (validate) => {
        if (validate) {
          const createdQuizReview = await quizDbService.storeQuizReview(
            body,
            userIfExists
          );
          /**
           * Track amplitude quiz review
           */
          AnalyticsService.sendEvent(
            ANALYTICS_EVENTS.CHALLENGE_REVIEW_SUBMITTED,
            {
              "Challenge Name": createdQuizReview.quizName,
              "Difficulty Level": createdQuizReview.difficultyLevel,
              "Fun Level": createdQuizReview.funLevel,
              "Want More": createdQuizReview.wantMore ? "Yes" : "No",
            },
            {
              user_id: userIfExists._id,
            }
          );
          return this.Ok(ctx, {
            message: "Quiz Review Stored Successfully",
            data: createdQuizReview,
          });
        }
      });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

  /**
   * @description This method is used to store quiz categories
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-categories", method: HttpMethod.GET })
  @Auth()
  public async quizCategories(ctx: any) {
    try {
      let userIfExists = await UserTable.findOne({ _id: ctx.request.user._id });
      if (!userIfExists) {
        return this.BadRequest(ctx, "User not found");
      }
      let quizResultsData = await QuizResult.aggregate([
        {
          $lookup: {
            from: "quiz",
            localField: "quizId",
            foreignField: "_id",
            as: "quizData",
          },
        },
        {
          $unwind: {
            path: "$quizData",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $match: {
            $and: [
              {
                "quizData.quizNum": {
                  $exists: true,
                },
              },
              {
                "quizData.quizNum": {
                  $ne: 0,
                },
              },
            ],
            isOnBoardingQuiz: false,
            userId: userIfExists._id,
          },
        },
      ]).exec();
      const quizCategories = await QuizDBService.listQuizCategories(
        quizResultsData
      );
      const isQuizLimitReached = await QuizDBService.checkQuizLimitReached(
        quizResultsData,
        userIfExists._id
      );
      /**
       * Give any 3 random quizzes if quiz not played
       */
      let quizzes: any;
      if (quizResultsData.length === 0) {
        quizzes = await QuizDBService.getRandomQuiz();
      } else {
        quizzes = await QuizDBService.getMostPlayedCategoryQuizzes(
          userIfExists._id
        );
      }
      return this.Ok(ctx, {
        data: {
          categories: quizCategories,
          quizzes,
          isQuizLimitReached,
        },
      });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

  /**
   * @description This method is used to store quiz categories
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/leagues", method: HttpMethod.GET })
  @Auth()
  public async getLeagues(ctx: any) {
    try {
      const leagues = await LeagueTable.find({})
        .select("_id name image minPoint maxPoint colorCode")
        .sort({ minPoint: 1 });
      return this.Ok(ctx, {
        data: leagues,
      });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }
}

export default new QuizController();
