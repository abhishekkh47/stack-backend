import { NetworkError } from "@app/middleware";
import {
  QuizTopicTable,
  QuizCategoryTable,
  QuizLevelTable,
  ChecklistResultTable,
  QuizTable,
  DailyChallengeTable,
} from "@app/model";
import {
  QUIZ_TYPE,
  XP_POINTS,
  CORRECT_ANSWER_FUEL_POINTS,
  CATEGORY_COUNT,
  LEVEL_COUNT,
  LEVEL_QUIZ_COUNT,
  START_FROM_SCRATCH,
  DAILY_GOALS,
  CHECKLIST_QUESTION_LENGTH,
} from "@app/utility";
import { IUser } from "@app/types";
import { ObjectId } from "mongodb";
import { UserService } from "@services/v9";
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
        ChecklistResultTable.find({ userId: (userIfExists as any)._id })
          .sort({
            createdAt: -1,
          })
          .lean(),
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
        const currentLevel = topicQuizzes.length
          ? topicQuizzes[0].actionNum == 4
            ? topicQuizzes[0].level + 1
            : topicQuizzes[0].level
          : 1;
        return { ...topic, userProgress, currentLevel };
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
        const isUnlocked = await this.checkActiveCategory(nextCategory._id);
        nextCategory = {
          _id: nextCategory._id,
          topicId: nextCategory.topicId,
          description: nextCategory.description,
          levels: nextCategory.levels,
          title: nextCategory.title,
          isUnlocked,
        };
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
      await ChecklistResultTable.findOneAndUpdate(
        {
          userId: userId,
          levelId: reqParam.levelId,
          actionNum: reqParam.actionNum,
        },
        {
          $set: {
            userId,
            topicId: reqParam.topicId,
            categoryId: reqParam.categoryId,
            levelId: reqParam.levelId,
            level: reqParam.level,
            actionNum: reqParam.actionNum,
          },
        },
        { upsert: true }
      );
      return;
    } catch (err) {
      throw new NetworkError("Error occured while claiming the reward", 400);
    }
  }

  /**
   * @description get all Topics and their categories
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
   * @param categoryId
   * @returns {*}
   */
  public async checkActiveCategory(categoryId: any) {
    let levels = await QuizLevelTable.find({ categoryId });
    for (let i = 0; i < levels.length; i++) {
      if (levels[i].actions.length != 4) return false;
    }
    return true;
  }

  /**
   * @description get the date difference between today and last updated goals
   * @param dateToCompare the udpatedAt timestamp of the record
   * @returns {*}
   */
  private getDaysNum(dateToCompare: string) {
    const firstDate = new Date(dateToCompare);
    const secondDate = new Date();
    firstDate.setHours(0, 0, 0, 0);
    secondDate.setHours(0, 0, 0, 0);
    const differenceInTime = secondDate.getTime() - firstDate.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return Math.abs(differenceInDays);
  }

  /**
   * @description get the date difference between today and last updated goals
   * @param userIfExists
   * @param goals array of checklist challenges
   * @returns {*}
   */
  private async updateLevelStatus(userIfExists: any, goals: any) {
    return await Promise.all(
      goals.map(async (goal) => {
        const res = await ChecklistResultTable.findOne({
          userId: userIfExists._id,
          levelId: goal.id,
          actionNum: 4,
        });
        if (res) {
          return { ...goal, isCompleted: true };
        }
        return goal;
      })
    );
  }

  /**
   * @description update the status if ai tools is used or not
   * @param challenges AI Tools details
   * @param aiToolsUsageStatus current status of ai tools in DB
   * @returns {*}
   */
  private updateChallenges(challenges: any[], aiToolsUsageStatus: any) {
    return challenges.map((challenge) => {
      if (aiToolsUsageStatus && aiToolsUsageStatus[challenge.key]) {
        return { ...challenge, isCompleted: true };
      }
      return challenge;
    });
  }

  /**
   * @description this function returns the currently saved challenges in DB if available
   * @param availableDailyChallenges current daily challenges in db
   * @param aiToolsUsageStatus updated status of AI tools
   * @param userIfExists
   * @returns {*}
   */
  private async handleAvailableDailyChallenges(
    availableDailyChallenges: any,
    aiToolsUsageStatus: any,
    userIfExists: any
  ) {
    if (
      availableDailyChallenges &&
      this.getDaysNum(availableDailyChallenges["updatedAt"]) < 1
    ) {
      const currentDailyGoalsStatus = availableDailyChallenges.dailyGoalStatus;
      const currentLength = currentDailyGoalsStatus.length;
      if (currentLength > 3) {
        const updatedChallenges = this.updateChallenges(
          currentDailyGoalsStatus.slice(0, currentLength - 1),
          aiToolsUsageStatus
        );
        return [
          ...updatedChallenges,
          ...(await this.updateLevelStatus(userIfExists, [
            currentDailyGoalsStatus[currentLength - 1],
          ])),
        ];
      }
      return currentLength
        ? await this.updateLevelStatus(userIfExists, currentDailyGoalsStatus)
        : [];
    }
    return null;
  }

  /**
   * @description get personalized daily challenges to be completed by the user
   * @param userIfExists
   * @param categoryId
   * @returns {*}
   */
  public async getDailyChallenges(userIfExists: any, categoryId: any) {
    try {
      let response = null;
      const [
        lastPlayedChallenge,
        aiToolsUsageStatus,
        availableDailyChallenges,
      ]: any = await Promise.all([
        ChecklistResultTable.findOne({
          userId: (userIfExists as any)._id,
          categoryId,
        }).sort({ createdAt: -1 }),
        UserService.userAIToolUsageStatus(userIfExists),
        DailyChallengeTable.findOne({ userId: userIfExists._id }).lean(),
      ]);

      let dateDiff = this.getDaysNum(userIfExists.createdAt);
      const currentCategory = lastPlayedChallenge
        ? lastPlayedChallenge.categoryId
        : categoryId;

      const currentResponse = await this.handleAvailableDailyChallenges(
        availableDailyChallenges,
        aiToolsUsageStatus,
        userIfExists
      );
      if (currentResponse) return currentResponse;

      const getAITools = (start: number = 0, numTools: number) => {
        return this.updateChallenges(
          DAILY_GOALS.slice(start, numTools),
          aiToolsUsageStatus
        );
      };

      const areDay1AIToolsCompleted = () => {
        return (
          (aiToolsUsageStatus.description ||
            aiToolsUsageStatus.ideaValidation) &&
          aiToolsUsageStatus.targetAudience &&
          aiToolsUsageStatus.competitors
        );
      };
      const areDay2AIToolsCompleted = () => {
        return (
          aiToolsUsageStatus.companyLogo &&
          aiToolsUsageStatus.companyName &&
          aiToolsUsageStatus.colorsAndAesthetic
        );
      };

      if (dateDiff < 1) {
        response = [
          ...getAITools(0, 3),
          ...(await this.getNextChallenges(userIfExists, currentCategory, 1)),
        ];
      } else if (!areDay1AIToolsCompleted()) {
        response = [
          ...getAITools(0, 6),
          ...(await this.getNextChallenges(userIfExists, currentCategory, 1)),
        ];
      } else if (areDay1AIToolsCompleted() && !areDay2AIToolsCompleted()) {
        response = [
          ...getAITools(3, 6),
          ...(await this.getNextChallenges(userIfExists, currentCategory, 1)),
        ];
      } else {
        response = [
          ...(await this.getNextChallenges(userIfExists, currentCategory, 2)),
        ];
      }
      await DailyChallengeTable.updateOne(
        { userId: userIfExists._id },
        { $set: { dailyGoalStatus: response } },
        { upsert: true }
      );
      return response;
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving daily challenges",
        400
      );
    }
  }

  /**
   * @description get next quizzes to be completed on current day
   * @param userIfExists
   * @param currentCategory
   * @param nums number of challenges to played on current day
   * @returns {*}
   */
  private async getNextChallenges(
    userIfExists: any,
    currentCategory: any,
    nums: number
  ) {
    try {
      const todayChallenges = [];
      const currentChallenges = await this.getLevelsAndChallenges(
        userIfExists,
        currentCategory
      );
      const currentLevel = currentChallenges.currentLevel;

      const createChallenge = (
        challenges: any,
        level: number,
        levelIndex: number
      ) => ({
        id: challenges.levels[levelIndex]._id,
        title: `Level ${level}: ${challenges.levels[levelIndex].title}`,
        key: "challenges",
        time: "6 min",
        isCompleted: false,
        categoryId: challenges.categoryId,
      });

      const addNextLevelChallenge = async (
        levelOffset: number,
        levelNum: number = null
      ) => {
        const levelNumber = levelNum
          ? levelNum
          : currentChallenges.levels[4].level + levelOffset;
        const nextLevel = await QuizLevelTable.findOne({
          level: levelNumber,
          topicId: currentChallenges.topicId,
        });
        if (
          nextLevel?.categoryId &&
          (await this.checkActiveCategory(nextLevel.categoryId))
        ) {
          todayChallenges.push({
            id: nextLevel._id,
            title: `Level ${nextLevel.level}: ${nextLevel.title}`,
            key: "challenges",
            time: "6 min",
            isCompleted: false,
            categoryId: nextLevel.categoryId,
          });
        }
      };

      if (!currentChallenges.checklistFlowCompleted) {
        todayChallenges.push(
          createChallenge(
            currentChallenges,
            currentLevel,
            (currentLevel - 1) % 5
          )
        );
      } else {
        await addNextLevelChallenge(1);
      }

      if (nums === 2) {
        if (!currentChallenges.checklistFlowCompleted) {
          if (currentLevel % 5 !== 0) {
            todayChallenges.push(
              createChallenge(
                currentChallenges,
                currentLevel + 1,
                currentLevel % 5
              )
            );
          } else {
            await addNextLevelChallenge(1, currentLevel + 1);
          }
        } else {
          await addNextLevelChallenge(2);
        }
      }
      return todayChallenges;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}
export default new ChecklistDBService();
