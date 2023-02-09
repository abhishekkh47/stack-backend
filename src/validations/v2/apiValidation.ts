let Joi = require("joi")
Joi = Joi.defaults((schema) => schema.options({
  allowUnknown: true 
}));

import { validationMessageKey } from "../../utility";
export const validations = {
  checkValidMobileValidation: (req, res, callback) => {
    const schema = Joi.object({
      type: Joi.number().valid(1, 2, 3).required(),
      mobile: Joi.string()
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
        .required(),
      firstName: Joi.string()
        .allow("")
        .regex(/^[A-za-z]*$/)
        .optional(),
      lastName: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/^[a-zA-Z]([\w -]*[a-zA-Z])?$/)
          .optional()
          .allow(""),
        otherwise: Joi.string()
          .allow("")
          .regex(/^[a-zA-Z]([\w -]*[a-zA-Z])?$/)
          .optional(),
      }),
    });
    const { error } = schema.validate(req);

    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("checkValidMobileValidation", error))
      );
    return callback(true);
  },
  signupValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      type: Joi.number().optional().valid(1, 2, 3),
      mobile: Joi.string()
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
        .required(),
      email: Joi.string().email().optional(),
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
  redeemCryptoValidation: (req, res, callback) => {
    const schema = Joi.object({
      dripshopId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      userId: Joi.string()
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
  addDeviceTokenValidation: (req, res, callback) => {
    const schema = Joi.object({
      deviceToken: Joi.string().required(),
      userId: Joi.string().required(),
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
      userId: Joi.string().required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("removeDeviceToken", error))
      );
    return callback(true);
  },
  updateDobValidation: (req, res, callback) => {
    const schema = Joi.object({
      dob: Joi.date()
        .iso()
        .max(Date.now() + 60 * 60 * 1000)
        .required(),
      userId: Joi.string().required(),
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
      userId: Joi.string().required(),
    });
    const { error } = schema.validate(req, { allowUnknown: true });
    if (error) {
      return res.throw(400, res.__(validationMessageKey("verifyOtp", error)));
    }
    return callback(true);
  },
  toggleNotificationValidation: (req, res, callback) => {
    const schema = Joi.object({
      isNotificationOn: Joi.number().required().valid(0, 1),
      userId: Joi.string().required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("toggleNotification", error))
      );
    return callback(true);
  },
  getUserQuizDataValidation: (req, res, callback) => {
    const schema = Joi.object({
      topicId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      userId: Joi.string().required(),
    });

    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("getUserQuiz", error)));
    }
    return callback(true);
  },
  
};
