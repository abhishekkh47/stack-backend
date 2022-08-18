import { CryptoTable, QuizResult, TransactionTable } from "../model";
import { ETransactionType } from "../types";

class getQuizService {
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
}

export default new getQuizService();
