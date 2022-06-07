import Joi from "joi";
import { validationMessageKey } from "../utility";
import { EUserType } from "../types";
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
  addBankDetailsValidation: (req, res, callback) => {
    const schema = Joi.object({
      publicToken: Joi.string().required(),
      accountId: Joi.string().required(),
      institutionId: Joi.string().required(),
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
      username: Joi.string()
        .min(5)
        .regex(/^[A-Za-z0-9][A-Za-z0-9_@.-]+$/)
        .required(),
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
      mobile: Joi.string()
        .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
        .required(),
      email: Joi.string().email().required(),
      childMobile: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
          .disallow(Joi.ref("mobile"))
          .required(),
      }),
      password: Joi.string()
        .min(8)
        .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .required(),
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
          .regex(/^\+[1-9]{1}[0-9]{10,14}$/)
          .disallow(Joi.ref("mobile"))
          .required(),
      }),
      parentEmail: Joi.when("type", {
        is: 1,
        then: Joi.string().email().disallow(Joi.ref("email")).required(),
      }),
      dob: Joi.date().iso().when("type", {
        is: 2,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
      fileTaxesInUS: Joi.when("type", {
        is: 2,
        then: Joi.number().valid(0, 1),
      }),
      citizenOfUS: Joi.when("type", {
        is: 2,
        then: Joi.number().valid(0, 1),
      }),
      taxIdNo: Joi.when("type", {
        is: 2,
        then: Joi.string()
          .regex(/^\d{9}$/)
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
      code: Joi.number().integer().min(100000).max(999999).required(),
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
      // username: Joi.string()
      //   .min(5)
      //   .regex(/^[A-Za-z0-9][A-Za-z0-9_@.-]+$/),
      // password: Joi.string()
      //   .min(8)
      //   .regex(/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
      //   .required(),
      type: Joi.number().valid(1, 2).required(), // 1 - google and 2 - apple
      email: Joi.string().email().required(),
      deviceToken: Joi.string(),
      socialLoginToken: Joi.string().required(),
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
        .regex(/^[A-Za-z0-9][A-Za-z0-9_@.-]+$/)
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
  addDepositValidation: (req, res, type, callback) => {
    const schema = Joi.object({
      amount: Joi.number()
        .min(5)
        .max(10000000)
        .positive()
        .precision(2)
        .required(),
      childId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
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
    });
    const { error } = schema.validate(req, { convert: false });
    if (error) {
      return res.throw(400, res.__(validationMessageKey("sellCrypto", error)));
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
      childEmail: Joi.string().email().allow("").disallow(Joi.ref("email")),
      childFirstName: Joi.string()
        .min(2)
        .regex(/^[A-za-z]*$/)
        .required(),
      childLastName: Joi.string()
        .min(2)
        .regex(/^[A-za-z]*$/)
        .required(),
    });
    const { error } = schema.validate(req);
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
      email: Joi.string().email().required(),
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
        .regex(/^[A-za-z]*$/),
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
};
