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
        .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z]).*$/)
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
};
