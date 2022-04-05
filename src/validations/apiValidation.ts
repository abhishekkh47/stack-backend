import Joi from "joi";
import { validationMessageKey } from "@app/utility";
export const validation = {
  getUserQuizDataValidation: (req, res, callback) => {
    const schema = Joi.object({
      quizId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });

    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("getUserQuiz", error)));
    }
    return callback(true);
  },
  addQuizResultValidation: (req, res, callback) => {
    const schema = Joi.object({
      quizId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      solvedQuestions: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("addQuizResult", error))
      );
    }
    return callback(true);
  },
  getQuizListValidation: (req, res, callback) => {
    const schema = Joi.object({
      topicId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });

    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("getQuizList", error)));
    }
    return callback(true);
  },
  changePasswordValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      old_password: Joi.string().required(),
      new_password: Joi.string()
        .min(8)
        .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("changePwd", error)));
    }
    return callback(true);
  },
  changeAddressValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      address: Joi.string().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("changeAddr", error)));
    }
    return callback(true);
  },
  changeEmailValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      email: Joi.string().email().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("changeEmail", error)));
    }
    return callback(true);
  },
  checkUniqueUserNameValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      username: Joi.string().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("checkUserName", error))
      );
    }
    return callback(true);
  },
  signupValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      type: Joi.number().valid(1, 2).required(),
      username: Joi.string()
        .min(5)
        .regex(/^[A-Za-z][A-Za-z0-9_@.-]+$/)
        .required(),
      password: Joi.string()
        .min(8)
        .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .required(),
      mobile: Joi.string()
        .regex(/^([0|\+[0-9]{1,5})?([7-9][0-9]{9,13})$/)
        .required(),
      email: Joi.string().email().optional(),
      firstName: Joi.string()
        .min(2)
        .regex(/^[A-za-z]*$/)
        .required(),
      lastName: Joi.string()
        .min(2)
        .regex(/^[A-za-z]*$/)
        .required(),
      parentMobile: Joi.when("type", {
        is: 1,
        then: Joi.string()
          .regex(/^([0|\+[0-9]{1,5})?([7-9][0-9]{9,13})$/)
          .disallow(Joi.ref("mobile"))
          .required(),
      }),
      parentEmail: Joi.when("type", {
        is: 1,
        then: Joi.string().email().disallow(Joi.ref("email")).required(),
      }),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("signupValidation", error))
      );
    }
    return callback(true);
  },
  changeMobileNumberValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      mobile: Joi.string()
        .regex(/^([0|\+[0-9]{1,5})?([7-9][0-9]{9,13})$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("changeMobile", error))
      );
    }
    return callback(true);
  },
  verifyOtpValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      mobile: Joi.string()
        .regex(/^([0|\+[0-9]{1,5})?([7-9][0-9]{9,13})$/)
        .required(),
      code: Joi.number().integer().min(100000).max(999999).required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("verifyOtp", error)));
    }
    return callback(true);
  },
  sendIssueInputValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().email(),
      mobile: Joi.string().regex(/^([0|\+[0-9]{1,5})?([7-9][0-9]{9})$/),
      issue: Joi.string().required(),
    });

    const { error } = schema.validate(req);
    if (error)
      return res.throw(400, res.__(validationMessageKey("sendIssue", error)));
    return callback(true);
  },
  loginValidation: (req, res, callback) => {
    const schema = Joi.object({
      username: Joi.string()
        .min(5)
        .regex(/^[A-Za-z][A-Za-z0-9_@.-]+$/)
        .required(),
      password: Joi.string()
        .min(8)
        .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .required(),
    });

    const { error } = schema.validate(req);
    if (error)
      return res.throw(400, res.__(validationMessageKey("login", error)));
    return callback(true);
  },
  updateNewPasswordValidation: (req, res, callback) => {
    const schema = Joi.object({
      username: Joi.string()
        .min(5)
        .regex(/^[A-Za-z][A-Za-z0-9_@.-]+$/)
        .required(),
      tempPassword: Joi.string().required(),
      new_password: Joi.string()
        .min(8)
        .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .disallow(Joi.ref("tempPassword"))
        .required(),
    });

    const { error } = schema.validate(req);
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("updateNewPassword", error))
      );
    return callback(true);
  },
  addDepositValidation: (req, res, callback) => {
    const schema = Joi.object({
      amount: Joi.number().min(5).positive().precision(2).required(),
    });

    const { error } = schema.validate(req, { convert: false });
    if (error)
      return res.throw(400, res.__(validationMessageKey("addDeposit", error)));
    return callback(true);
  },
  addCryptoInputValidation: (req, res, callback) => {
    const schema = Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
      }).required()
    );
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("addCrypto", error)));
    }
    return callback(true);
  },
  cancelPendingValidation: (req, res, callback) => {
    const schema = Joi.object({
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("cancelPending", error))
      );
    }
    return callback(true);
  },
};
