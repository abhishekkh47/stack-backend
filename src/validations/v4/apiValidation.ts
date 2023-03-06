let Joi = require("joi");
Joi = Joi.defaults((schema) =>
  schema.options({
    allowUnknown: true,
  })
);

import { validationMessageKey } from "../../utility";
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
};
