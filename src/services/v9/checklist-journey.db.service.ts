import { NetworkError } from "@app/middleware";
import {
  QuizTopicTable,
  QuizCategoryTable,
  QuizLevelTable,
  ChecklistResultTable,
  QuizTable,
} from "@app/model";
import {
  QUIZ_TYPE,
  XP_POINTS,
  CORRECT_ANSWER_FUEL_POINTS,
  CATEGORY_COUNT,
  LEVEL_COUNT,
  LEVEL_QUIZ_COUNT,
  START_FROM_SCRATCH,
  PERFECT_IDEA,
  CHECKLIST_QUESTION_LENGTH,
} from "@app/utility";
import { IUser } from "@app/types";
import { ObjectId } from "mongodb";
class ChecklistDBService {
  /**
   * @description get all Topics and current level in each topic
   * @param userIfExists
   * @returns {*}
   */
  public async getQuizTopics(userIfExists: IUser) {
    try {
      let [quizTopics, completedQuizzes] = await Promise.all([
        QuizTopicTable.find({ type: 4 }, { topic: 1, order: 1 })
          .sort({ order: 1 })
          .lean(),
        ChecklistResultTable.find({ userId: (userIfExists as any)._id }),
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
  public async getQuizCategories(userIfExists: IUser, topicId: string) {
    try {
      let categoryProgress = 0;
      let [quizCategory, completedQuizzes, topicDetails] = await Promise.all([
        QuizCategoryTable.find(
          { topicId },
          { _id: 1, topicId: 1, topic: "$title", levels: 1 }
        )
          .sort({ order: 1 })
          .lean(),
        ChecklistResultTable.find({ userId: (userIfExists as any)._id })
          .sort({
            createdAt: -1,
          })
          .lean(),
        QuizTopicTable.findOne({ _id: topicId }, { topic: 1 }).lean(),
      ]);
      const lastCompletedChallenge = completedQuizzes[0];
      let activeCategory = 0;
      let quizCategories = quizCategory.map((category) => {
        const categoryQuizzes = completedQuizzes.filter(
          (quiz) => quiz.categoryId.toString() == category._id.toString()
        );
        const numCompletedQuizzes = categoryQuizzes.length;
        const totalQuizzes = LEVEL_COUNT * LEVEL_QUIZ_COUNT; // Assuming each category has 5 levels and each level has 4 quizzes
        const userProgress = Math.floor(
          (numCompletedQuizzes / totalQuizzes) * 100
        );
        if (userProgress == 100) categoryProgress += 1;
        return { ...category, userProgress, isUnlocked: true, isActive: false };
      });
      const categoryLength = quizCategories.length;
      quizCategories.map((category, index) => {
        quizCategories[index - 1] &&
        quizCategories[index - 1]?.userProgress < 100
          ? (category.isUnlocked = false)
          : (category.isUnlocked = true);
        if (lastCompletedChallenge) {
          if (
            lastCompletedChallenge?.categoryId.toString() ==
              category._id.toString() &&
            lastCompletedChallenge?.level % 5 == 0 &&
            lastCompletedChallenge?.actionNum == 4
          ) {
            activeCategory = index + 1;
          } else if (lastCompletedChallenge?.categoryId == category._id) {
            activeCategory = index;
          }
        }

        if (activeCategory == categoryLength) {
          activeCategory -= 1;
        }
      });

      const isCorrectActiveCategory = await this.checkActiveCategory(
        quizCategories[activeCategory]._id
      );
      if (isCorrectActiveCategory) {
        quizCategories[activeCategory].isActive = true;
      } else if (activeCategory == 0) {
        quizCategories[activeCategory].isUnlocked = false;
        quizCategories[activeCategory].isActive = true;
      } else {
        quizCategories[activeCategory].isUnlocked = false;
        quizCategories[activeCategory - 1].isActive = true;
      }
      return {
        topicDetails: {
          ...topicDetails,
          userProgress: (categoryProgress / quizCategories.length) * 100,
          completedLevels: categoryProgress,
          totalLevels: quizCategories.length,
        },
        quizCategories,
      };
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
  public async getLevelsAndChallenges(userIfExists: IUser, categoryId: string) {
    try {
      let upcomingChallenge = {};
      let upcomingQuizId = null;
      let upcomingQuizDetails = null;
      let checklistFlowCompleted = false;
      let nextCategory = null;
      let currentActionNum = 0;
      let currentLevel = 0;
      let currentLevels = null;
      let upcomingLevelIndex = 0;
      const [quizCategoryDetails, quizLevelsDetails, lastPlayedChallenge]: any =
        await Promise.all([
          QuizCategoryTable.findOne({ _id: categoryId }).populate("topicId"),
          QuizLevelTable.find({ categoryId }).sort({ level: 1 }).lean(),
          ChecklistResultTable.findOne({
            userId: (userIfExists as any)._id,
            categoryId,
          }).sort({ createdAt: -1 }),
        ]);
      const quizCategory = await QuizCategoryTable.find(
        {
          topicId: quizCategoryDetails.topicId._id,
        },
        { _id: 1, topicId: 1, title: 1, description: 1, levels: 1 }
      ).sort({ order: 1 });
      if (quizCategory.length == quizCategoryDetails.order) {
        nextCategory = null;
      } else {
        nextCategory = quizCategory[quizCategoryDetails.order];
      }

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
        upcomingQuizId =
          quizLevelsDetails[upcomingLevelIndex].actions[0].quizId;
        upcomingQuizDetails = await this.getQuizDetails(upcomingQuizId);
        currentLevels = quizLevelsDetails[upcomingLevelIndex].actions;
        Object.assign(currentLevels[upcomingLevelIndex], {
          quizDetails: upcomingQuizDetails[0],
        });
        currentActionNum = 1;
        currentLevel = quizLevelsDetails[upcomingLevelIndex].level;
      } else {
        let upcomingLevel =
          lastPlayedChallenge.level +
          (lastPlayedChallenge.actionNum === 4 ? 1 : 0);
        upcomingLevelIndex =
          upcomingLevel % 5 == 0 ? 4 : (upcomingLevel % 5) - 1;
        let upcomingActionNum =
          lastPlayedChallenge.actionNum === 4
            ? 1
            : lastPlayedChallenge.actionNum + 1;
        upcomingQuizId =
          quizLevelsDetails[upcomingLevelIndex].actions[upcomingActionNum - 1]
            .quizId;
        currentLevels = quizLevelsDetails[upcomingActionNum].actions;
        upcomingQuizDetails = await this.getQuizDetails(upcomingQuizId);
        currentActionNum = upcomingActionNum;
        currentLevel = upcomingLevel;
        Object.assign(currentLevels[upcomingActionNum - 1], {
          quizDetails: upcomingQuizDetails[0],
        });
      }
      Object.assign(levels[upcomingLevelIndex], {
        challenges: currentLevels,
      });

      return {
        levels,
        checklistFlowCompleted,
        currentActionNum,
        currentLevel,
        topicId: quizCategoryDetails.topicId._id,
        topicOrder: quizCategoryDetails.topicId.order,
        topic: quizCategoryDetails.topicId.topic,
        categoryId: quizCategoryDetails._id,
        category: quizCategoryDetails.title,
        nextCategory,
      };
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
                    $eq: ["$quizType", QUIZ_TYPE.STORY],
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
              if: { $eq: ["$quizType", QUIZ_TYPE.NORMAL] },
              then:
                XP_POINTS.COMPLETED_QUIZ +
                CHECKLIST_QUESTION_LENGTH.QUIZ * XP_POINTS.CORRECT_ANSWER,
              else: {
                $cond: {
                  if: { $eq: ["$quizType", QUIZ_TYPE.STORY] },
                  then:
                    XP_POINTS.COMPLETED_QUIZ +
                    CHECKLIST_QUESTION_LENGTH.STORY * XP_POINTS.CORRECT_ANSWER,
                  else:
                    XP_POINTS.COMPLETED_QUIZ +
                    CHECKLIST_QUESTION_LENGTH.SIMULATION *
                      XP_POINTS.CORRECT_ANSWER,
                },
              },
            },
          },
          fuelCount: {
            $cond: {
              if: { $eq: ["$quizType", QUIZ_TYPE.NORMAL] },
              then:
                CHECKLIST_QUESTION_LENGTH.QUIZ *
                CORRECT_ANSWER_FUEL_POINTS.QUIZ,
              else: {
                $cond: {
                  if: { $eq: ["$quizType", QUIZ_TYPE.STORY] },
                  then:
                    CHECKLIST_QUESTION_LENGTH.STORY *
                    CORRECT_ANSWER_FUEL_POINTS.STORY,
                  else:
                    CHECKLIST_QUESTION_LENGTH.SIMULATION *
                    CORRECT_ANSWER_FUEL_POINTS.SIMULATION,
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

  /**
   * @description get a default categoryId which is not yet completed, to open when a user logs in
   * @param userIfExists
   * @param topicId
   * @returns {*}
   */
  public async getDefaultLevelsAndChallenges(
    userIfExists: IUser,
    topicId: string = null
  ) {
    try {
      let currentCategoryId = null;
      let currentTopicId = null;
      const lastPlayedChallenge = await ChecklistResultTable.findOne({
        userId: (userIfExists as any)._id,
      }).sort({ createdAt: -1 });
      if (lastPlayedChallenge) {
        currentCategoryId = lastPlayedChallenge.categoryId.toString();
      } else {
        currentTopicId = topicId;
        if (!topicId) {
          const quizTopics = await this.getQuizTopics(userIfExists);
          let currentTopic = quizTopics[quizTopics.length - 1];
          for (const topic of quizTopics) {
            if (topic.userProgress < 100) {
              currentTopic = topic;
              break;
            }
          }
          currentTopicId = currentTopic._id;
        }
        const { quizCategories } = await this.getQuizCategories(
          userIfExists,
          currentTopicId
        );
        let currentCategory = quizCategories[quizCategories.length - 1];
        for (const category of quizCategories) {
          if (category.userProgress < 100) {
            currentCategory = category;
            break;
          }
        }
        currentCategoryId = currentCategory._id;
      }

      return currentCategoryId;
    } catch (err) {
      throw new NetworkError("Error occurred while retrieving quizzes", 400);
    }
  }

  /**
   * @description store status for each levelup status
   * @param userId
   * @param reqParam
   * @returns {*}
   */
  public async storeWeeklyReward(userId: any, reqParam: any) {
    try {
      ChecklistResultTable.create({
        userId,
        topicId: reqParam.topicId,
        categoryId: reqParam.categoryId,
        levelId: reqParam.levelId,
        level: reqParam.level,
        actionNum: reqParam.actionNum,
      });
      return;
    } catch (err) {
      throw new NetworkError("Error occured while claiming the reward", 400);
    }
  }

  /**
   * @description get all Topics and current level in each topic
   * @returns {*}
   */
  public async getFocusArea() {
    try {
      let startFromScratch = { ...START_FROM_SCRATCH };
      let focusAreas = await QuizTopicTable.aggregate([
        {
          $match: {
            type: 4,
          },
        },
        {
          $sort: {
            order: 1,
          },
        },
        {
          $lookup: {
            from: "quiz_categories",
            localField: "_id",
            foreignField: "topicId",
            as: "categories",
          },
        },
        {
          $sort: {
            "categories.order": -1,
          },
        },
        {
          $project: {
            _id: 1,
            title: "$topic",
            image: 1,
            order: 1,
            "categories._id": 1,
            "categories.title": 1,
            "categories.description": 1,
            "categories.order": 1,
          },
        },
      ]);

      startFromScratch.categories = [...focusAreas[0].categories];
      focusAreas.push(startFromScratch);
      focusAreas.map((area) => {
        area.categories.unshift(PERFECT_IDEA);
        area.categories.sort((a, b) => a.order - b.order);
      });

      return focusAreas;
    } catch (err) {
      throw new NetworkError(
        "Error occurred while retrieving quiz topics",
        400
      );
    }
  }
  /**
   * @description verify if all the levels in a category with all 4 challenges present
   * @returns {*}
   */
  public async checkActiveCategory(categoryId) {
    let levels = await QuizLevelTable.find({ categoryId });
    for (let i = 0; i < levels.length; i++) {
      if (levels[i].actions.length != 4) return false;
    }
    return true;
  }
}
export default new ChecklistDBService();
