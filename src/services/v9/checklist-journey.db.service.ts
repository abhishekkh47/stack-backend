import { NetworkError } from "@app/middleware";
import {
  QuizTopicTable,
  QuizCategoryTable,
  QuizLevelTable,
  ChecklistResultTable,
  QuizTable,
} from "@app/model";
import {
  SIMULATION_QUIZ_FUEL,
  QUIZ_TYPE,
  XP_POINTS,
  CORRECT_ANSWER_FUEL_POINTS,
  CATEGORY_COUNT,
  LEVEL_COUNT,
  LEVEL_QUIZ_COUNT,
} from "@app/utility";
import { ObjectId } from "mongodb";
class ChecklistDBService {
  /**
   * @description get all Topics and current level in each topic
   * @param userIfExists
   * @returns {*}
   */
  public async getQuizTopics(userIfExists: any) {
    try {
      let [quizTopics, completedQuizzes] = await Promise.all([
        QuizTopicTable.find({ type: 4 }, { topic: 1, order: 1 }).lean(),
        ChecklistResultTable.find({ userId: userIfExists._id }),
      ]);

      let topics = quizTopics.map((topic) => {
        const topicQuizzes = completedQuizzes.filter(
          (quiz) => quiz.topicId.toString() == topic._id.toString()
        );
        const numCompletedQuizzes = topicQuizzes.length;
        const totalQuizzes = LEVEL_COUNT * LEVEL_QUIZ_COUNT * CATEGORY_COUNT;
        const userProgress = Math.ceil(
          (numCompletedQuizzes / totalQuizzes) * 100
        );
        return { ...topic, userProgress };
      });

      return topics;
    } catch (err) {
      throw new NetworkError(
        "Error occurred while retrieving quiz topics",
        400
      );
    }
  }

  /**
   * @description get all categories in a topic and corresponding completed level
   * @param userIfExists
   * @param topicId
   * @returns {*}
   */
  public async getQuizCategories(userIfExists: any, topicId: any) {
    try {
      let [quizCategory, completedQuizzes] = await Promise.all([
        QuizCategoryTable.find(
          { topicId },
          { _id: 1, topicId: 1, title: 1, description: 1, order: 1 }
        )
          .sort({ order: 1 })
          .lean(),
        ChecklistResultTable.find({ userId: userIfExists._id }),
      ]);
      let quizCategories = quizCategory.map((category) => {
        const categoryQuizzes = completedQuizzes.filter(
          (quiz) => quiz.categoryId.toString() == category._id.toString()
        );
        const numCompletedQuizzes = categoryQuizzes.length;
        const totalQuizzes = LEVEL_COUNT * LEVEL_QUIZ_COUNT; // Assuming each category has 5 levels and each level has 4 quizzes
        const userProgress = Math.floor(
          (numCompletedQuizzes / totalQuizzes) * 100
        );
        return { ...category, userProgress };
      });

      return quizCategories;
    } catch (err) {
      throw new NetworkError(
        "Error occurred while retrieving quiz categories",
        400
      );
    }
  }

  /**
   * @description get the current level and challenges of the chosen category
   * @param userIfExists
   * @param categoryId
   * @returns {*}
   */
  public async getLevelsAndChallenges(userIfExists: any, categoryId: any) {
    try {
      let upcomingChallenge = {};
      let upcomingQuizId = null;
      let upcomingQuizDetails = null;
      let checklistFlowCompleted = false;
      const [quizCategoryDetails, quizLevelsDetails, lastPlayedChallenge]: any =
        await Promise.all([
          QuizCategoryTable.findOne({ _id: categoryId }).populate("topicId"),
          QuizLevelTable.find({ categoryId }).sort({ level: 1 }),
          ChecklistResultTable.findOne({
            userId: userIfExists._id,
            categoryId,
          }).sort({ createdAt: -1 }),
        ]);

      const levels = quizLevelsDetails.map((obj) => ({
        _id: obj._id,
        title: obj.title,
        level: obj.level,
      }));

      if (
        lastPlayedChallenge &&
        lastPlayedChallenge.level % 5 == 0 &&
        lastPlayedChallenge.actionNum == 4
      ) {
        upcomingChallenge = null;
        checklistFlowCompleted = true;
      } else if (!lastPlayedChallenge) {
        upcomingQuizId = quizLevelsDetails[0].actions[0].quizId;
        upcomingQuizDetails = await this.getQuizDetails(upcomingQuizId);
        upcomingChallenge = {
          level: quizLevelsDetails[0].level,
          title: quizLevelsDetails[0].title,
          topicId: quizCategoryDetails.topicId._id,
          topic: quizCategoryDetails.topicId.topic,
          categoryId: quizCategoryDetails._id,
          category: quizCategoryDetails.title,
          quizId: upcomingQuizId,
          quizDetails: upcomingQuizDetails,
          actionNum: 1,
        };
      } else {
        let upcomingLevel =
          lastPlayedChallenge.level +
          (lastPlayedChallenge.actionNum === 4 ? 1 : 0);
        let upcomingLevelIndex =
          upcomingLevel % 5 == 0 ? 4 : (upcomingLevel % 5) - 1;
        let upcomingActionNum =
          lastPlayedChallenge.actionNum === 4
            ? 1
            : lastPlayedChallenge.actionNum + 1;
        upcomingQuizId =
          quizLevelsDetails[upcomingLevelIndex].actions[upcomingActionNum - 1]
            .quizId;
        upcomingQuizDetails = await this.getQuizDetails(upcomingQuizId);
        upcomingChallenge = {
          level: upcomingLevel,
          title: quizLevelsDetails[upcomingLevelIndex].title,
          topicId: quizCategoryDetails.topicId._id,
          topic: quizCategoryDetails.topicId.topic,
          categoryId: quizCategoryDetails._id,
          category: quizCategoryDetails.title,
          quizId: upcomingQuizId,
          quizDetails: upcomingQuizDetails,
          actionNum: upcomingActionNum,
        };
      }

      return { levels, upcomingChallenge, checklistFlowCompleted };
    } catch (err) {
      throw new NetworkError("Error occurred while retrieving challenge", 400);
    }
  }

  /**
   * @description get quiz details for a given quizId
   * @param quizId
   * @returns {*}
   */
  async getQuizDetails(quizId: ObjectId) {
    return await QuizTable.aggregate([
      {
        $match: {
          _id: quizId,
        },
      },
      {
        $lookup: {
          from: "quizquestions",
          localField: "_id",
          foreignField: "quizId",
          as: "quizQuestions",
        },
      },
      {
        $addFields: {
          quizQuestionsFiltered: {
            $filter: {
              input: "$quizQuestions",
              as: "question",
              cond: {
                $and: [
                  {
                    $eq: ["$$question.question_type", 2],
                  },
                  {
                    $eq: ["$quizType", 3],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          quizQuestionsLength: { $size: "$quizQuestionsFiltered" },
        },
      },
      {
        $addFields: {
          isUnlocked: false,
          xpPoints: {
            $cond: {
              if: { $eq: ["$quizType", QUIZ_TYPE.SIMULATION] },
              then: XP_POINTS.SIMULATION_QUIZ,
              else: XP_POINTS.COMPLETED_QUIZ,
            },
          },
          fuelCount: {
            $cond: {
              if: { $eq: ["$quizType", QUIZ_TYPE.SIMULATION] },
              then: SIMULATION_QUIZ_FUEL,
              else: {
                $cond: {
                  if: { $eq: ["$quizType", QUIZ_TYPE.STORY] },
                  then: {
                    $multiply: [
                      CORRECT_ANSWER_FUEL_POINTS,
                      "$quizQuestionsLength",
                    ],
                  },
                  else: {
                    $multiply: [
                      CORRECT_ANSWER_FUEL_POINTS,
                      { $size: "$quizQuestions" },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: quizId,
          name: "$quizName",
          image: 1,
          topicId: 1,
          stageId: 1,
          isCompleted: 1,
          xpPoints: 1,
          fuelCount: 1,
          quizType: 1,
          isUnlocked: 1,
          characterName: 1,
          characterImage: 1,
        },
      },
    ]);
  }
}
export default new ChecklistDBService();
