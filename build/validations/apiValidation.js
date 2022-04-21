"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const joi_1 = __importDefault(require("joi"));
const utility_1 = require("@app/utility");
const types_1 = require("@app/types");
exports.validation = {
    getUserQuizDataValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            quizId: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("getUserQuiz", error)));
        }
        return callback(true);
    },
    addQuizResultValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            quizId: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
            solvedQuestions: joi_1.default.array()
                .items(joi_1.default.string().regex(/^[0-9a-fA-F]{24}$/))
                .required(),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("addQuizResult", error)));
        }
        return callback(true);
    },
    getQuizListValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            topicId: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("getQuizList", error)));
        }
        return callback(true);
    },
    changePasswordValidation: (req, res, callback) => {
        const schema = joi_1.default.object().keys({
            old_password: joi_1.default.string().required(),
            new_password: joi_1.default.string()
                .min(8)
                .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
                .required(),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("changePwd", error)));
        }
        return callback(true);
    },
    changeAddressValidation: (req, res, callback) => {
        const schema = joi_1.default.object().keys({
            address: joi_1.default.string().required(),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("changeAddr", error)));
        }
        return callback(true);
    },
    changeEmailValidation: (req, res, callback) => {
        const schema = joi_1.default.object().keys({
            email: joi_1.default.string().email().required(),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("changeEmail", error)));
        }
        return callback(true);
    },
    checkUniqueUserNameValidation: (req, res, callback) => {
        const schema = joi_1.default.object().keys({
            username: joi_1.default.string()
                .min(5)
                .regex(/^[A-Za-z][A-Za-z0-9_@.-]+$/)
                .required(),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("checkUserName", error)));
        }
        return callback(true);
    },
    signupValidation: (req, res, callback) => {
        const schema = joi_1.default.object().keys({
            type: joi_1.default.number().valid(1, 2).required(),
            username: joi_1.default.string()
                .min(5)
                .regex(/^[A-Za-z][A-Za-z0-9_@.-]+$/)
                .required(),
            mobile: joi_1.default.string()
                .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
                .required(),
            email: joi_1.default.string().email().required(),
            childMobile: joi_1.default.when("type", {
                is: 2,
                then: joi_1.default.string()
                    .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
                    .disallow(joi_1.default.ref("mobile"))
                    .required(),
            }),
            password: joi_1.default.string()
                .min(8)
                .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
                .required(),
            firstName: joi_1.default.string()
                .min(2)
                .regex(/^[A-za-z]*$/)
                .required(),
            lastName: joi_1.default.string()
                .min(2)
                .regex(/^[A-za-z]*$/)
                .required(),
            parentMobile: joi_1.default.when("type", {
                is: 1,
                then: joi_1.default.string()
                    .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
                    .disallow(joi_1.default.ref("mobile"))
                    .required(),
            }),
            parentEmail: joi_1.default.when("type", {
                is: 1,
                then: joi_1.default.string().email().disallow(joi_1.default.ref("email")).required(),
            }),
            dob: joi_1.default.date().iso().when("type", {
                is: 2,
                then: joi_1.default.required(),
                otherwise: joi_1.default.forbidden(),
            }),
            fileTaxesInUS: joi_1.default.when("type", {
                is: 2,
                then: joi_1.default.number().valid(0, 1).required(),
            }),
            citizenOfUS: joi_1.default.when("type", {
                is: 2,
                then: joi_1.default.number().valid(0, 1).required(),
            }),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("signupValidation", error)));
        }
        return callback(true);
    },
    changeMobileNumberValidation: (req, res, callback) => {
        const schema = joi_1.default.object().keys({
            mobile: joi_1.default.string()
                .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
                .required(),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("changeMobile", error)));
        }
        return callback(true);
    },
    verifyOtpValidation: (req, res, callback) => {
        const schema = joi_1.default.object().keys({
            mobile: joi_1.default.string()
                .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
                .required(),
            code: joi_1.default.number().integer().min(100000).max(999999).required(),
        });
        const { error } = schema.validate(req, { allowUnknown: true });
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("verifyOtp", error)));
        }
        return callback(true);
    },
    sendIssueInputValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            email: joi_1.default.string().email(),
            mobile: joi_1.default.string().regex(/^\+[1-9]{1}[0-9]{10,14}$/),
            issue: joi_1.default.string().required(),
        });
        const { error } = schema.validate(req);
        if (error)
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("sendIssue", error)));
        return callback(true);
    },
    loginValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            email: joi_1.default.string().email(),
            username: joi_1.default.string()
                .min(5)
                .regex(/^[A-Za-z][A-Za-z0-9_@.-]+$/),
            password: joi_1.default.string()
                .min(8)
                .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
                .required(),
        });
        const { error } = schema.validate(req);
        if (error)
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("login", error)));
        return callback(true);
    },
    updateNewPasswordValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            username: joi_1.default.string()
                .min(5)
                .regex(/^[A-Za-z][A-Za-z0-9_@.-]+$/)
                .required(),
            tempPassword: joi_1.default.string().required(),
            new_password: joi_1.default.string()
                .min(8)
                .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
                .disallow(joi_1.default.ref("tempPassword"))
                .required(),
        });
        const { error } = schema.validate(req);
        if (error)
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("updateNewPassword", error)));
        return callback(true);
    },
    addDepositValidation: (req, res, type, callback) => {
        console.log(type, "type");
        const schema = joi_1.default.object({
            amount: joi_1.default.number()
                .min(5)
                .max(10000000)
                .positive()
                .precision(2)
                .required(),
            depositType: type == types_1.EUserType.PARENT ? joi_1.default.number().valid(1, 2).required() : null,
            publicToken: joi_1.default.when("depositType", {
                is: 1,
                then: joi_1.default.string().required(),
            }),
            accountId: joi_1.default.when("depositType", {
                is: 1,
                then: joi_1.default.string().required(),
            }),
        });
        const { error } = schema.validate(req, { convert: false });
        if (error)
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("addDeposit", error)));
        return callback(true);
    },
    addCryptoInputValidation: (req, res, callback) => {
        const schema = joi_1.default.array().items(joi_1.default.object({
            name: joi_1.default.string().required(),
        }).required());
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("addCrypto", error)));
        }
        return callback(true);
    },
    cancelPendingValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            id: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("cancelPending", error)));
        }
        return callback(true);
    },
    withdrawMoneyValidation: (req, res, type, callback) => {
        const schema = joi_1.default.object({
            amount: joi_1.default.number().min(1).positive().precision(2).required(),
            withdrawType: type == types_1.EUserType.PARENT ? joi_1.default.number().valid(1).required() : null,
            publicToken: joi_1.default.when("withdrawType", {
                is: 1,
                then: joi_1.default.string().required(),
            }),
            accountId: joi_1.default.when("withdrawType", {
                is: 1,
                then: joi_1.default.string().required(),
            }),
        });
        const { error } = schema.validate(req, { convert: false });
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("withdrawMoney", error)));
        }
        return callback(true);
    },
    buyCryptoValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            amount: joi_1.default.number().min(1).positive().precision(2).required(),
            cryptoId: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
        });
        const { error } = schema.validate(req, { convert: false });
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("buyCrypto", error)));
        }
        return callback(true);
    },
    checkAccountReadyToLinkValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            mobile: joi_1.default.string()
                .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
                .required(),
            childMobile: joi_1.default.string()
                .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
                .disallow(joi_1.default.ref("mobile"))
                .required(),
            email: joi_1.default.string().email().required(),
            childEmail: joi_1.default.string().email().disallow(joi_1.default.ref("email")).required(),
        });
        const { error } = schema.validate(req);
        if (error)
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("checkAccountReadyToLink", error)));
        return callback(true);
    },
    storeUserDetailsValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            country: joi_1.default.string()
                .regex(/[A-Za-z]/)
                .required(),
            stateId: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
            city: joi_1.default.string()
                .regex(/[A-Za-z]/)
                .required(),
            address: joi_1.default.string()
                .regex(/[A-Za-z]/)
                .required(),
            unitApt: joi_1.default.string()
                .regex(/[A-Za-z]/)
                .required(),
            postalCode: joi_1.default.string()
                .regex(/[A-Za-z0-9]/)
                .min(4)
                .required(),
            liquidAsset: joi_1.default.number()
                .min(1)
                .positive()
                .precision(2)
                .strict()
                .required(),
        });
        const { error } = schema.validate(req);
        if (error)
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("storeUserDetails", error)));
        return callback(true);
    },
    updateTaxInfoRequestBodyValidation: (req, res, callabck) => {
        const schema = joi_1.default.object({
            taxIdNo: joi_1.default.string()
                .regex(/^[0-9]*$/)
                .min(5)
                .max(15)
                .required(),
            taxState: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
        });
        const { error } = schema.validate(req);
        if (error)
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("updateTaxInfo", error)));
        return callabck(true);
    },
    confirmMobileNumberValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            mobile: joi_1.default.string()
                .regex(/^+[1-9]{1}[0-9]{10,14}$/)
                .required(),
            email: joi_1.default.string().email().required(),
        });
        const { error } = schema.validate(req);
        if (error)
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("confirmMobileNumber", error)));
        return callback(true);
    },
    getAssetValidation: (req, res, callback) => {
        const schema = joi_1.default.object({
            page: joi_1.default.string()
                .regex(/^[0-9]*$/)
                .required(),
            limit: joi_1.default.string()
                .regex(/^[0-9]*$/)
                .required(),
        });
        const { error } = schema.validate(req);
        if (error)
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("getAsset", error)));
        return callback(true);
    },
    checkUniqueEmailValidation: (req, res, callback) => {
        const schema = joi_1.default.object().keys({
            email: joi_1.default.string().email().required(),
        });
        const { error } = schema.validate(req);
        if (error) {
            return res.throw(400, res.__((0, utility_1.validationMessageKey)("checkUniqueEmail", error)));
        }
        return callback(true);
    },
};
//# sourceMappingURL=apiValidation.js.map