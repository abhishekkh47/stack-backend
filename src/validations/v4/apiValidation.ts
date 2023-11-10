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
      funLevel: Joi.number().valid(1, 2, 3, 4, 5).optional(),
      difficultyLevel: Joi.number().valid(1, 2, 3, 4, 5).optional(),
      wantMore: Joi.number().valid(0, 1).optional(),
      ratings: Joi.number().valid(1, 2, 3, 4, 5).optional(),
      feedback: Joi.array().items(Joi.string()).unique().min(1).max(5),
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
  setProfilePictureLeaderValidation: (req, res, callback) => {
    const schema = Joi.object({
      name: Joi.string()
        .required()
        .regex(/\.png$/, { name: "png_extension", invert: false })
        .messages({
          "string.base": `Image name must be a string`,
          "string.empty": `Image name cannot be empty`,
          "string.pattern.invert.base": `Image name must end with '.png'`,
          "any.required": `Image name is required`,
        }),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("setProfilePictureLeaderValidation", error))
      );
    }
    return callback(true);
  },
  dripShopValidation: (req, res, callback) => {
    const schema = Joi.object({
      firstName: Joi.string()
        .regex(/^[a-zA-Z]+$/)
        .required(),
      lastName: Joi.string()
        .regex(/^[a-zA-Z]+$/)
        .required(),
      address: Joi.string().required(),
      selectedSize: Joi.string().allow().optional(),
      apartment: Joi.string().allow().optional(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("dripShopValidation", error))
      );
    }
    return callback(true);
  },
  businessProfileValidation: (req, res, callback) => {
    const schema = Joi.object({
      impacts: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      passions: Joi.array()
        .max(3)
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
        )
        .required(),
      description: Joi.string().min(2).max(280).required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("businessProfileValidation", error))
      );
    }
    return callback(true);
  },
  suggestTopicValidation: (req, res, callback) => {
    const schema = Joi.object({
      topic: Joi.string().min(2).max(280).required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("suggestTopicValidation", error))
      );
    }
    return callback(true);
  },
  commitStreakGoalValidation: (req, res, callback) => {
    const schema = Joi.object({
      streakGoalId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("commitStreakGoalValidation", error))
      );
    }
    return callback(true);
  },
  updateTimezoneValidation: (req, res, callback) => {
    const schema = Joi.object({
      timezone: Joi.string()
        .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("updateTimezoneValidation", error))
      );
    }
    return callback(true);
  },
  createCommunityValidation: (req, res, callback) => {
    const schema = Joi.object({
      name: Joi.string()
        .regex(/^[a-zA-Z]+$/)
        .required(),
      googlePlaceId: Joi.string()
        .regex(/^[A-Za-z0-9-_]+$/)
        .required(),
      createdBy: Joi.string()
        .regex(/^[[0-9a-fA-F]{24}$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("createCommunityValidation", error))
      );
    }
    return callback(true);
  },
  joinCommunityValidation: (req, res, callback) => {
    const schema = Joi.object({
      userId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      communityId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("joinCommunityValidation", error))
      );
    }
    return callback(true);
  },
};
