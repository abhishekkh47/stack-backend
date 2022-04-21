"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeBetweenTwoQuiz = exports.everyCorrectAnswerPoints = exports.EQuizAnswerType = exports.ECorrectAnswer = exports.EQuizQuestionType = exports.EQuizTopicStatus = void 0;
var EQuizTopicStatus;
(function (EQuizTopicStatus) {
    EQuizTopicStatus[EQuizTopicStatus["ACTIVE"] = 1] = "ACTIVE";
    EQuizTopicStatus[EQuizTopicStatus["INACTIVE"] = 0] = "INACTIVE";
})(EQuizTopicStatus = exports.EQuizTopicStatus || (exports.EQuizTopicStatus = {}));
var EQuizQuestionType;
(function (EQuizQuestionType) {
    EQuizQuestionType[EQuizQuestionType["BEST_ANSWER"] = 1] = "BEST_ANSWER";
    EQuizQuestionType[EQuizQuestionType["FILL_IN_BLANKS"] = 2] = "FILL_IN_BLANKS";
    EQuizQuestionType[EQuizQuestionType["TRUE_FALSE"] = 3] = "TRUE_FALSE";
})(EQuizQuestionType = exports.EQuizQuestionType || (exports.EQuizQuestionType = {}));
var ECorrectAnswer;
(function (ECorrectAnswer) {
    ECorrectAnswer[ECorrectAnswer["TRUE"] = 1] = "TRUE";
    ECorrectAnswer[ECorrectAnswer["FALSE"] = 0] = "FALSE";
})(ECorrectAnswer = exports.ECorrectAnswer || (exports.ECorrectAnswer = {}));
var EQuizAnswerType;
(function (EQuizAnswerType) {
    EQuizAnswerType[EQuizAnswerType["TEXT"] = 1] = "TEXT";
    EQuizAnswerType[EQuizAnswerType["IMAGE"] = 2] = "IMAGE";
})(EQuizAnswerType = exports.EQuizAnswerType || (exports.EQuizAnswerType = {}));
exports.everyCorrectAnswerPoints = 10;
exports.timeBetweenTwoQuiz = 72.0;
//# sourceMappingURL=quiz.js.map