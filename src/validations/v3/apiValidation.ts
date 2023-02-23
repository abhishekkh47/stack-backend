let Joi = require("joi");
Joi = Joi.defaults((schema) =>
  schema.options({
    allowUnknown: true,
  })
);

import { validationMessageKey } from "../../utility";
export const validationsV3 = {
  checkUserSignupValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      email: Joi.string().email().required(),
      loginType: Joi.number().valid(1, 2).required(), // 1 - google and 2 - apple
      socialLoginToken: Joi.string().required(),
      deviceType: Joi.number().valid(1, 2),
      firstName: Joi.string().allow("").optional(),
      lastName: Joi.string().allow("").optional(),
      deviceToken: Joi.string().optional().allow(""),
      dob: Joi.date()
        .iso()
        .max(Date.now() + 60 * 60 * 1000),
      type: Joi.number().valid(1, 2, 3),
    });
    const { error } = schema.validate(req, { allowUnknown: true });
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("checkUserSignupValidation", error))
      );
    }
    return callback(true);
  },
  addQuizResultValidation: (req, res, callback) => {
    const schema = Joi.object({
      quizId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      pointsEarned: Joi.number().integer().required(),
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
  unlockRewardValidation: (req, res, callback) => {
    const schema = Joi.object({
      action: Joi.number().valid(1, 2).required(), // 1 - unlock and 2 - no thanks
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("unlockReward", error))
      );
    }
    return callback(true);
  },
  signupValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      type: Joi.number().optional().valid(1, 2, 3),
      mobile: Joi.string()
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
        .required(),
      email: Joi.string().email().optional(),
      firstName: Joi.string()
        .allow("")
        .regex(/^[a-zA-Z]([\w -]*[a-zA-Z])?$/)
        .optional(),
      lastName: Joi.string()
        .allow("")
        .regex(/^[a-zA-Z]([\w -]*[a-zA-Z])?$/)
        .optional(),
      refferalCode: Joi.string().optional(),
      deviceToken: Joi.string().optional().allow(""),
      childMobile: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
          .disallow(Joi.ref("mobile"))
          .required(),
      }),
      parentMobile: Joi.when("type", {
        is: 1,
        then: Joi.string()
          .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
          .disallow(Joi.ref("mobile"))
          .required(),
      }),
      taxIdNo: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/^\d{9}$/)
          .optional()
          .allow(""),
      }),
      country: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/[A-Za-z]/)
          .optional()
          .allow(""),
      }),
      state: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/[A-Za-z]/)
          .optional()
          .allow(""),
      }),
      city: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/[A-Za-z]/)
          .optional()
          .allow(""),
      }),
      address: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/[A-Za-z]/)
          .optional()
          .allow(""),
      }),
      unitApt: Joi.when("type", {
        is: 2,
        then: Joi.string().allow(null).allow(""),
      }),
      postalCode: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/[A-Za-z0-9]/)
          .min(4)
          .optional()
          .allow(""),
      }),
    });
    const { error } = schema.validate(req, { allowUnknown: true });
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("signupValidation", error))
      );
    }
    return callback(true);
  },
};
