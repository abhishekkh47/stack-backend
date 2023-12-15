let Joi = require("joi");
Joi = Joi.defaults((schema) =>
  schema.options({
    allowUnknown: true,
  })
);

import { validationMessageKey } from "@app/utility";
export const validationsV7 = {
  businessProfileValidation: (req, res, callback) => {
    const schema = Joi.object({
      key: Joi.string().min(2).max(280).required(),
      value: Joi.string().min(2).max(280).required(),
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
};
