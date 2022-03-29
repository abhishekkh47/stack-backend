import Joi from "joi";

export const validation = {
  getUserQuizDataValidation: (req, res, callback) => {
    const schema = Joi.object({
      quizId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .message("Quiz Details Not Found")
        .required(),
    });

    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, error.details[0].message);
    }
    return callback(true);
  },
};
