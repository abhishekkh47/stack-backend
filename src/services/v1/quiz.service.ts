import { QuizResult } from "@app/model";

class QuizService {
  public async checkQuizExists(matchedCondition: any) {
    const quizExists = await QuizResult.aggregate([
      {
        $match: matchedCondition,
      },
      {
        $group: {
          _id: 0,
          sum: {
            $sum: "$pointsEarned",
          },
        },
      },
      {
        $project: {
          _id: 0,
          sum: 1,
        },
      },
    ]).exec();
    return quizExists.length > 0 ? quizExists : [];
  }

  /**
   * @description give an array of all the quiz played
   */
  public async getQuizInfoOfUser(quizData: any) {
    let quizDataToAddInCrm = quizData.map((res, index) => {
      return {
        Quiz_Number: index + 1,

        Points: res.pointsEarned,
      };
    });

    return quizDataToAddInCrm;
  }
}

export default new QuizService();
