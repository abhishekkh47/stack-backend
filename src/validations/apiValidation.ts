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
  addQuizResultValidation: (req, res, callback) => {
    const schema = Joi.object({
      quizId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .message("Quiz Details Not Found")
        .required(),
      solvedQuestions: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .message("Solved Question Details Not Found")
        )
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, error.details[0].message);
    }
    return callback(true);
  },
  getQuizListValidation: (req, res, callback) => {
    const schema = Joi.object({
      topicId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .message("topicId is required.")
        .required(),
    });

    const { error } = schema.validate(req);
    if (error) {
      return res.throw(400, error.details[0].message);
    }
    return callback(true);
  },
};
