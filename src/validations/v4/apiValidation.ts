let Joi = require("joi");
Joi = Joi.defaults((schema) =>
  schema.options({
    allowUnknown: true,
  })
);

import { validationMessageKey } from "@app/utility";
export const validationsV4 = {
  addDeviceTokenValidation: (req, res, callback) => {
    const schema = Joi.object({
      deviceToken: Joi.string().required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("addDeviceToken", error))
      );
    return callback(true);
  },
  removeDeviceTokenValidation: (req, res, callback) => {
    const schema = Joi.object({
      deviceToken: Joi.string().required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("removeDeviceToken", error))
      );
    return callback(true);
  },
  toggleNotificationValidation: (req, res, callback) => {
    const schema = Joi.object({
      isNotificationOn: Joi.number().required().valid(0, 1),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("toggleNotification", error))
      );
    return callback(true);
  },
  redeemCryptoValidation: (req, res, callback) => {
    const schema = Joi.object({
      dripshopId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("redeemCrypto", error))
      );
    return callback(true);
  },
  updateDobValidation: (req, res, callback) => {
    const schema = Joi.object({
      dob: Joi.date()
        .iso()
        .max(Date.now() + 60 * 60 * 1000)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(400, res.__(validationMessageKey("updateDOB", error)));
    return callback(true);
  },
  verifyOtpValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      mobile: Joi.string()
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
        .required(),
      code: Joi.number().integer().required(),
    });
    const { error } = schema.validate(req, { allowUnknown: true });
    if (error) {
      return res.throw(400, res.__(validationMessageKey("verifyOtp", error)));
    }
    return callback(true);
  },
  getUserQuizDataValidation: (req, res, callback) => {
    const schema = Joi.object({
      topicId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });

    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("getUserQuiz", error)));
    }
    return callback(true);
  },
  quizReviewValidation: (req, res, callback) => {
    const schema = Joi.object({
      quizId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      funLevel: Joi.number().valid(1, 2, 3, 4, 5).required(),
      difficultyLevel: Joi.number().valid(1, 2, 3, 4, 5).required(),
      wantMore: Joi.number().valid(0, 1).required(),
    });

    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("quizReviewValidation", error))
      );
    }
    return callback(true);
  },
  changeNameValidation: (req, res, callback) => {
    const schema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().allow("").optional(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("changeNameValidation", error))
      );
    }
    return callback(true);
  },
};
