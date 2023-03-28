import { NetworkError } from "../../middleware/error.middleware";
import { get72HoursAhead, getQuizCooldown } from "../../utility";
import {
  QuizQuestionTable,
  QuizResult,
  QuizTable,
  QuizTopicTable,
} from "../../model";
class QuizDBService {
  /**
   * @description get quiz data
   * @param quizIds
   */
  public async getQuizData(quizIds: string[]) {
    const quizData = await QuizTopicTable.aggregate([
      {
        $sort: { createdAt: 1 },
      },
      {
        $match: {
          type: 2,
          status: 1,
        },
      },
      {
        $lookup: {
          from: "quiz",
          localField: "_id",
          foreignField: "topicId",
          as: "quizData",
        },
      },
      {
        $unwind: {
          path: "$quizData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isCompleted: {
            $cond: {
              if: {
                $in: ["$quizData._id", quizIds],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: "$quizData._id",
          image: "$quizData.image",
          name: "$quizData.quizName",
          isCompleted: 1,
          topicId: "$_id",
        },
      },
    ]).exec();
    if (quizData.length === 0) {
      throw Error("Quiz Not Found");
    }
    return quizData;
  }

  /**
   * @description get question list
   * @param userId
   * @param topicId
   * @param headers
   */
  public async getQuizQuestionList(
    userId: string,
    topicId: string,
    headers: object
  ) {
    const quizCheck: any = await QuizResult.findOne({
      userId: userId,
      topicId: topicId,
    }).sort({ createdAt: -1 });
    const quizIds: any = [];
    if (quizCheck !== null) {
      const Time = await get72HoursAhead(quizCheck.createdAt);
      const quizCooldown = await getQuizCooldown(headers);
      if (Time < quizCooldown) {
        throw new NetworkError(
          `Quiz is locked. Please wait for ${quizCooldown} hours to unlock this quiz`,
          400
        );
      }
    }
    const quizCheckCompleted = await QuizResult.find(
      {
        userId: userId,
        topicId: topicId,
      },
      {
        _id: 0,
        quizId: 1,
      }
    ).select("quizId");
    if (quizCheckCompleted.length == 0) {
    } else {
      for (const quizId of quizCheckCompleted) {
        quizIds.push(quizId.quizId);
      }
    }
    const data = await QuizTable.findOne({
      topicId: topicId,
      _id: { $nin: quizIds },
    }).sort({ createdAt: 1 });
    if (!data) {
      throw new NetworkError("Quiz Not Found", 400);
    }
    const quizQuestionList = await QuizQuestionTable.find({
      quizId: data._id,
    }).select(
      "_id quizId text answer_array points question_image question_type answer_type"
    );
    return quizQuestionList;
  }
}

export default new QuizDBService();
