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
      old_password: Joi.string()
        .message("Please enter valid old password")
        .required(),
      new_password: Joi.string()
        .min(6)
        .message("Please enter valid new password with minimum length 6")
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/)
        .required(),
      confirm_password: Joi.string()
        .valid(Joi.ref("new_password"))
        .message("New Password should be similiar to Confirm Password")
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, error.details[0].message);
    }
    return callback(true);
  },
};
