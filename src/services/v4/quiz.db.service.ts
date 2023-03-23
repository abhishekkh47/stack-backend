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
   * @description get quiz topics
   * @param topicIds
   */
  public async getQuizTopics(topicIds: string[]) {
    const quizTopics = await QuizTopicTable.aggregate([
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
        $addFields: {
          isCompleted: {
            $cond: {
              if: {
                $in: ["$_id", topicIds],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          isCompleted: 1,
          image: 1,
          topic: 1,
        },
      },
    ]).exec();
    if (quizTopics.length === 0) {
      throw Error("Quiz Topics Not Found");
    }
    return quizTopics;
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
