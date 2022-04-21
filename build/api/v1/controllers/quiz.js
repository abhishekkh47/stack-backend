"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const utility_1 = require("@app/utility");
const base_1 = __importDefault(require("./base"));
const middleware_1 = require("@app/middleware");
const types_1 = require("@app/types");
const model_1 = require("@app/model");
const apiValidation_1 = require("../../../validations/apiValidation");
const moment_1 = __importDefault(require("moment"));
class QuizController extends base_1.default {
    async getQuizTopics(ctx) {
        const quizTopics = await model_1.QuizTopicTable.find({
            status: types_1.EQuizTopicStatus.ACTIVE,
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
    async addQuizTopics(ctx) {
        if (!ctx.request.body.topic) {
            return this.BadRequest(ctx, "Please Enter Topic Name");
        }
        const checkQuizTopicExists = await model_1.QuizTopicTable.findOne({
            topic: ctx.request.body.topic,
        });
        if (checkQuizTopicExists) {
            return this.BadRequest(ctx, `Topic name ${ctx.request.body.topic} already exists`);
        }
        await model_1.QuizTopicTable.create({
            topic: ctx.request.body.topic,
        });
        return this.Created(ctx, {
            topic: ctx.request.body.topic,
            message: "Quiz Topic Created Successfully",
        });
    }
    async createQuiz(ctx) {
        await model_1.QuizTable.create(ctx.request.body);
        return this.Created(ctx, {
            quizName: ctx.request.body.quizName,
            topicId: ctx.request.body.topicId,
            points: ctx.request.body.points,
            videoUrl: ctx.request.body.videoUrl,
            message: "Quiz Created Successfully",
        });
    }
    async createQuizQuestion(ctx) {
        await model_1.QuizQuestionTable.create(ctx.request.body);
        return this.Created(ctx, {
            message: "Quiz Question Created Successfully",
        });
    }
    async getQuizInformation(ctx) {
        const user = ctx.request.user;
        const checkQuizExists = await model_1.QuizResult.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(user._id),
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
        if (checkQuizExists.length > 0) {
            dataToSent.totalStackPointsEarned = checkQuizExists[0].sum;
        }
        const getQuizQuestionsCount = await model_1.QuizQuestionResult.countDocuments({
            user_id: user._id,
        });
        dataToSent.totalQuestionSolved =
            checkQuizExists.length > 0 ? getQuizQuestionsCount : 0;
        const latestQuiz = await model_1.QuizResult.findOne({ userId: user._id }).sort({
            createdAt: -1,
        });
        dataToSent.lastQuizTime = latestQuiz
            ? (0, moment_1.default)(latestQuiz.createdAt).unix()
            : null;
        return this.Ok(ctx, dataToSent);
    }
    getQuestionList(ctx) {
        const reqParam = ctx.params;
        return apiValidation_1.validation.getUserQuizDataValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const quizQuestionList = await model_1.QuizQuestionTable.find({
                    quizId: reqParam.quizId,
                }).select("_id quizId text answer_array points");
                this.Ok(ctx, { quizQuestionList, message: "Success" });
            }
        });
    }
    postCurrentQuizResult(ctx) {
        const reqParam = ctx.request.body;
        const user = ctx.request.user;
        return apiValidation_1.validation.addQuizResultValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const quizExists = await model_1.QuizTable.findOne({ _id: reqParam.quizId });
                if (!quizExists) {
                    return this.BadRequest(ctx, "Quiz Details Doesn't Exists");
                }
                const quizResultExists = await model_1.QuizResult.findOne({
                    userId: user._id,
                    quizId: reqParam.quizId,
                });
                if (quizResultExists) {
                    return this.BadRequest(ctx, "You cannot submit the same quiz again");
                }
                const lastQuizPlayed = await model_1.QuizResult.findOne({
                    userId: user._id,
                }).sort({ createdAt: -1 });
                if (lastQuizPlayed) {
                    const timeDiff = await (0, utility_1.get72HoursAhead)(lastQuizPlayed.createdAt);
                    if (timeDiff <= types_1.timeBetweenTwoQuiz) {
                        return this.BadRequest(ctx, "Quiz is locked. Please wait for 72 hours to unlock this quiz");
                    }
                }
                const quizQuestions = [];
                let queExistsFlag = true;
                if (reqParam.solvedQuestions.length > 0) {
                    for (const solvedQue of reqParam.solvedQuestions) {
                        const queExists = await model_1.QuizQuestionTable.findOne({
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
                await model_1.QuizQuestionResult.insertMany(quizQuestions);
                const dataToCreate = {
                    topicId: quizExists.topicId,
                    quizId: quizExists._id,
                    userId: user._id,
                    pointsEarned: types_1.everyCorrectAnswerPoints * reqParam.solvedQuestions.length,
                };
                await model_1.QuizResult.create(dataToCreate);
                return this.Ok(ctx, { message: "Quiz Results Stored Successfully" });
            }
        });
    }
    getQuizList(ctx) {
        const reqParam = ctx.params;
        const user = ctx.request.user;
        return apiValidation_1.validation.getQuizListValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const quizCheck = await model_1.QuizResult.findOne({
                    userId: user._id,
                    topicId: reqParam.topicId,
                }).sort({ createdAt: -1 });
                const QuizIds = [];
                if (quizCheck !== null) {
                    const Time = await (0, utility_1.get72HoursAhead)(quizCheck.createdAt);
                    if (Time < types_1.timeBetweenTwoQuiz) {
                        return this.BadRequest(ctx, "Quiz is locked. Please wait for 72 hours to unlock this quiz.");
                    }
                    else {
                        const quizCheckCompleted = await model_1.QuizResult.find({
                            userId: user._id,
                            topicId: reqParam.topicId,
                        }, {
                            _id: 0,
                            quizId: 1,
                        }).select("quizId");
                        for (const quizId of quizCheckCompleted) {
                            QuizIds.push(quizId.quizId);
                        }
                    }
                }
                const data = await model_1.QuizTable.find({
                    topicId: reqParam.topicId,
                    _id: { $nin: QuizIds },
                });
                return this.Ok(ctx, { data, message: "Success" });
            }
        });
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/quiz-topics", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], QuizController.prototype, "getQuizTopics", null);
__decorate([
    (0, utility_1.Route)({ path: "/quiz-topics", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], QuizController.prototype, "addQuizTopics", null);
__decorate([
    (0, utility_1.Route)({ path: "/quiz", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], QuizController.prototype, "createQuiz", null);
__decorate([
    (0, utility_1.Route)({ path: "/quiz-question", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], QuizController.prototype, "createQuizQuestion", null);
__decorate([
    (0, utility_1.Route)({ path: "/quiz-result", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], QuizController.prototype, "getQuizInformation", null);
__decorate([
    (0, utility_1.Route)({ path: "/question-list/:quizId", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], QuizController.prototype, "getQuestionList", null);
__decorate([
    (0, utility_1.Route)({ path: "/add-quiz-result", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], QuizController.prototype, "postCurrentQuizResult", null);
__decorate([
    (0, utility_1.Route)({ path: "/quiz-list/:topicId", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], QuizController.prototype, "getQuizList", null);
exports.default = new QuizController();
//# sourceMappingURL=quiz.js.map