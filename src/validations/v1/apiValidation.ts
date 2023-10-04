let Joi = require("joi");
Joi = Joi.defaults((schema) =>
  schema.options({
    allowUnknown: true,
  })
);

import { validationMessageKey } from "@app/utility";
export const validation = {
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
  addQuizResultValidation: (req, res, callback) => {
    const schema = Joi.object({
      quizId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      solvedQuestions: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .required(),
      numOfIncorrectAnswers: Joi.number().optional(),
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
  logoutValidation: (req, res, callback) => {
    const schema = Joi.object({
      deviceToken: Joi.string().optional().allow(""),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("logout", error)));
    }
    return callback(true);
  },
  addBankDetailsValidation: (req, res, callback) => {
    const schema = Joi.object({
      publicToken: Joi.string().required(),
      accountId: Joi.string().required(),
      institutionId: Joi.string().required(),
      depositAmount: Joi.number(),
      isRecurring: Joi.number().valid(0, 1, 2, 3, 4),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("addBankDetails", error))
      );
    }
    return callback(true);
  },
  recurringDepositValidation: (req, res, callback) => {
    const schema = Joi.object({
      isRecurring: Joi.number().valid(0, 1, 2, 3, 4).required(),
      childId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      bankId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      selectedDeposit: Joi.when("isRecurring", {
        switch: [
          { is: 2, then: Joi.number().min(1).required() },
          { is: 3, then: Joi.number().min(1).required() },
          { is: 4, then: Joi.number().min(1).required() },
        ],
      }),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("recurringDepositValidation", error))
      );
    }
    return callback(true);
  },
  updateAutoApprovalValidation: (req, res, callback) => {
    const schema = Joi.object({
      isAutoApproval: Joi.number().valid(0, 1).required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("updateAutoApproval", error))
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
  changeAddressValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      address: Joi.string()
        .regex(/[A-Za-z]/)
        .required(),
      unitApt: Joi.string().allow(null).allow(""),
      postalCode: Joi.string()
        .regex(/^[0-9]{5}(-[0-9]{4})?$/)
        .min(4)
        .required(),
      stateId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      city: Joi.string()
        .regex(/[A-Za-z]/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("changeAddr", error)));
    }
    return callback(true);
  },
  switchBankAccountValidation: (req, res, callback) => {
    const schema = Joi.object({
      bankId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("switchBankAccount", error))
      );
    }
    return callback(true);
  },
  unlinkBankValidation: (req, res, callback) => {
    const schema = Joi.object({
      bankId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, res.__(validationMessageKey("unlinkBank", error)));
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
  checkUserSignupValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      email: Joi.string().email().required(),
      loginType: Joi.number().valid(1, 2).required(), // 1 - google and 2 - apple
      socialLoginToken: Joi.string().required(),
      deviceType: Joi.number().valid(1, 2),
      firstName: Joi.string().allow("").optional(),
      lastName: Joi.string().allow("").optional(),
      deviceToken: Joi.string().optional().allow(""),
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
  changeMobileNumberValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      mobile: Joi.string()
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
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
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
        .required(),
      code: Joi.number().integer().required(),
      referralCode: Joi.string().optional(),
    });
    const { error } = schema.validate(req, { allowUnknown: true });
    if (error) {
      return res.throw(400, res.__(validationMessageKey("verifyOtp", error)));
    }
    return callback(true);
  },
  sendIssueInputValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().email(),
      mobile: Joi.string().regex(/^\+[1-9]{1}[0-9]{10,14}$/),
      issue: Joi.string().required(),
    });

    const { error } = schema.validate(req);
    if (error)
      return res.throw(400, res.__(validationMessageKey("sendIssue", error)));
    return callback(true);
  },
  loginValidation: (req, res, callback) => {
    const schema = Joi.object({
      loginType: Joi.number().valid(1, 2).required(), // 1 - google and 2 - apple
      email: Joi.string().email().required(),
      deviceToken: Joi.string().optional().allow(""),
      socialLoginToken: Joi.string().required(),
      deviceType: Joi.number().valid(1, 2), // 1 - android and 2 - ios
    });

    const { error } = schema.validate(req);
    if (error)
      return res.throw(400, res.__(validationMessageKey("login", error)));
    return callback(true);
  },
  addDepositValidation: (req, res, type, callback) => {
    const schema = Joi.object({
      amount: Joi.number()
        .min(5)
        .max(10000000)
        .positive()
        .precision(2)
        .required(),
      childId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
      bankId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
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
  withdrawMoneyValidation: (req, res, type, callback) => {
    const schema = Joi.object({
      amount: Joi.number().min(1).positive().precision(2).required(),
      childId: Joi.string()
        .allow("")
        .regex(/^[0-9a-fA-F]{24}$/),
      bankId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });
    const { error } = schema.validate(req, { convert: false });
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("withdrawMoney", error))
      );
    }
    return callback(true);
  },
  buyCryptoValidation: (req, res, callback) => {
    const schema = Joi.object({
      amount: Joi.number().min(1).positive().precision(2).required(),
      cryptoId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      childId: Joi.string()
        .allow("")
        .regex(/^[0-9a-fA-F]{24}$/),
    });
    const { error } = schema.validate(req, { convert: false });
    if (error) {
      return res.throw(400, res.__(validationMessageKey("buyCrypto", error)));
    }
    return callback(true);
  },
  sellCryptoValidation: (req, res, callback) => {
    const schema = Joi.object({
      amount: Joi.number().min(1).positive().precision(2).required(),
      cryptoId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      childId: Joi.string()
        .allow("")
        .regex(/^[0-9a-fA-F]{24}$/),
      isMax: Joi.boolean(),
    });
    const { error } = schema.validate(req, { convert: false });
    if (error) {
      return res.throw(400, res.__(validationMessageKey("sellCrypto", error)));
    }
    return callback(true);
  },
  nextDepositDateValidation: (req, res, callback) => {
    const schema = Joi.object({
      userId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });
    const { error } = schema.validate(req, { convert: false });
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("nextDepositDate", error))
      );
    }
    return callback(true);
  },
  checkAccountReadyToLinkValidation: (req, res, callback) => {
    const schema = Joi.object({
      mobile: Joi.string()
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
        .required(),
      childMobile: Joi.string()
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
        .disallow(Joi.ref("mobile"))
        .required(),
      email: Joi.string().email().required(),
      childFirstName: Joi.string()
        .min(1)
        .allow("")
        .regex(/^[A-za-z]*$/)
        .required(),
      childLastName: Joi.string()
        .min(1)
        .allow("")
        .regex(/^[a-zA-Z]([\w -]*[a-zA-Z])?$/),
    });
    const { error } = schema.validate(req, { allowUnknown: true });
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("checkAccountReadyToLink", error))
      );
    return callback(true);
  },
  storeUserDetailsValidation: (req, res, callback) => {
    const schema = Joi.object({
      country: Joi.string()
        .regex(/[A-Za-z]/)
        .required(),
      stateId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      city: Joi.string()
        .regex(/[A-Za-z]/)
        .required(),
      address: Joi.string()
        .regex(/[A-Za-z]/)
        .required(),
      unitApt: Joi.string().allow(null).allow(""),
      postalCode: Joi.string()
        .regex(/[A-Za-z0-9]/)
        .min(4)
        .required(),
    });
    const { error } = schema.validate(req, { allowUnknown: true });
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("storeUserDetails", error))
      );
    return callback(true);
  },
  updateTaxInfoRequestBodyValidation: (req, res, callabck) => {
    const schema = Joi.object({
      taxIdNo: Joi.string()
        .regex(/^\d{9}$/)
        .min(5)
        .max(15)
        .required(),
      taxState: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("updateTaxInfo", error))
      );
    return callabck(true);
  },
  confirmMobileNumberValidation: (req, res, callback) => {
    const schema = Joi.object({
      mobile: Joi.string()
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
        .required(),
      email: Joi.string().email().required(),
    });
    const { error } = schema.validate(req);

    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("confirmMobileNumber", error))
      );
    return callback(true);
  },
  checkValidMobileValidation: (req, res, callback) => {
    const schema = Joi.object({
      type: Joi.number().valid(1, 2, 3).required(),
      mobile: Joi.string()
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
        .required(),
      taxIdNo: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/^\d{9}$/)
          .required(),
      }),
      country: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/[A-Za-z]/)
          .required(),
      }),
      state: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/[A-Za-z]/)
          .required(),
      }),
      city: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/[A-Za-z]/)
          .required(),
      }),
      address: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/[A-Za-z]/)
          .required(),
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
          .required(),
      }),
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
  getAssetValidation: (req, res, callback) => {
    const schema = Joi.object({
      page: Joi.string()
        .regex(/^[0-9]*$/)
        .required(),
      limit: Joi.string()
        .regex(/^[0-9]*$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(400, res.__(validationMessageKey("getAsset", error)));
    return callback(true);
  },
  checkUniqueEmailValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      mobile: Joi.string().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(
        400,
        res.__(validationMessageKey("checkUniqueEmail", error))
      );
    }
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
  dobValidation: (req, res, callback) => {
    const schema = Joi.object({
      dob: Joi.date()
        .iso()
        .max(Date.now() + 60 * 60 * 1000)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(400, res.__(validationMessageKey("dob", error)));
    return callback(true);
  },
  updateTypeValidation: (req, res, callback) => {
    const schema = Joi.object({
      type: Joi.number().valid(1, 2, 3).required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(400, res.__(validationMessageKey("updateDOB", error)));
    return callback(true);
  },
  typeValidation: (req, res, callback) => {
    const schema = Joi.object({
      type: Joi.number().valid(1, 2, 3).required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(400, res.__(validationMessageKey("type", error)));
    return callback(true);
  },
  notifyUserInputValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(400, res.__(validationMessageKey("notifyUser", error)));
    return callback(true);
  },
  changePrimeTrustValidation: (req, res, callback) => {
    const schema = Joi.object({
      "first-name": Joi.string()
        .allow("")
        .min(2)
        .regex(/^[A-za-z]*$/),
      "last-name": Joi.string()
        .allow("")
        .min(2)
        .regex(/^[a-zA-Z]([\w -]*[a-zA-Z])?$/),
      "date-of-birth": Joi.alternatives([
        Joi.date().iso(),
        Joi.string().allow(""),
      ]),
      "tax-id-number": Joi.string()
        .allow("")
        .regex(/^[0-9]*$/)
        .min(5)
        .max(15),
      "tax-state": Joi.string().allow(""),
      "primary-address": Joi.object({
        city: Joi.string().allow(""),
        country: Joi.string().allow(""),
        "postal-code": Joi.string().allow("").min(4),
        region: Joi.string().allow(""),
        "street-1": Joi.string().allow(""),
      }).default({}),
      media: Joi.string().allow(""),
      id_proof_front: Joi.string().allow(""),
      id_proof_back: Joi.string().allow(""),
    });
    const { error } = schema.validate(req, { allowUnknown: true });
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("changePrimeTrust", error))
      );
    return callback(true);
  },
  getPortFolioValidation: (req, res, callback) => {
    const schema = Joi.object({
      childId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    });
    const { error } = schema.validate(req);
    if (error)
      return res.throw(
        400,
        res.__(validationMessageKey("getPortFolio", error))
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
};
