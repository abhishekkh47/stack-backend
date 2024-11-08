import { ParentChildTable } from "@app/model/parentChild";
import axios from "axios";
import * as path from "path";
import sharp from "sharp";
import { ObjectId } from "mongodb";
import envData from "@app/config";
import { GoogleSpreadsheet } from "google-spreadsheet";
import {
  QuizQuestionResult,
  QuizQuestionTable,
  QuizResult,
  QuizTable,
  QuizTopicTable,
  WeeklyJourneyTable,
  WeeklyJourneyResultTable,
  CoachProfileTable,
  QuizCategoryTable,
  QuizLevelTable,
  MarketSegmentInfoTable,
  ProblemScoreTable,
  MarketScoreTable,
  AIToolDataSetTable,
  MilestoneTable,
  MilestoneGoalsTable,
  SuggestionScreenCopyTable,
  BusinessProfileTable,
  UserTable,
  DailyChallengeTable,
  AIToolDataSetTypesTable,
  AIToolsUsageStatusTable,
  CommunityTable,
  StageTable,
  MilestoneEventsTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import json2csv from "json2csv";
import fs from "fs";
import { Transform } from "stream";
import moment from "moment";
import {
  QUIZ_TYPE,
  STORY_QUESTION_TYPE,
  generateImage,
  UpscaleImage,
  downloadImage,
  uploadQuizImages,
  IPromptData,
  checkQuizImageExists,
  IMAGE_GENERATION_PROMPTS,
  SYSTEM,
  USER,
  IMPORT_SCRIPT,
  delay,
  CHECKLIST_QUESTION_LENGTH,
  CORRECT_ANSWER_FUEL_POINTS,
  PRODUCT_TYPE,
  IDEA_VALIDATION_STEPS,
  ACTIONS_TO_MOVE,
  hasGoalKey,
  mapHasGoalKey,
  DEFAULT_BUSINESS_LOGO,
  CHALLENGE_TYPE,
  SIMULATION_RESULT_COPY,
  MILESTONE_STAGE_REWARDS,
  MILESTONE_RESULT_COPY,
} from "@app/utility";
import OpenAI from "openai";

class ScriptService {
  public async sandboxApproveKYC(
    userId: string,
    primeTrustToken: string
  ): Promise<any> {
    if (!userId)
      return {
        status: 400,
        message: "Please provide a valid user ID",
      };

    const user = await ParentChildTable.findOne({
      userId: new ObjectId(userId),
    });

    if (!user) {
      return {
        status: 404,
        message: `User with ID ${userId} was not found`,
      };
    }

    if (!user.contactId) {
      return {
        status: 400,
        message: "No 'contactId' found...",
      };
    }

    // Make this a function since we send this exact request twice, just with different URLs
    const sendRequest = async (url: string) => {
      return await axios
        .post(
          url,
          {
            data: {
              type: "kyc-document-checks",
              attributes: {
                "contact-id": user.contactId,
                "uploaded-document-id": "a4634951-4fa4-4f81-92a5-b97217692320",
                "backside-document-id": "c319bffc-c798-4bef-876c-9ae65b23681e",
                "kyc-document-type": "drivers_license",
                identity: true,
                "identity-photo": true,
                "proof-of-address": true,
                "kyc-document-country": "US",
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${primeTrustToken}`,
            },
          }
        )
        .catch((error) => {});
    };

    // First part of Staging KYC Approval
    const checkResonse: any = await sendRequest(
      "https://sandbox.primetrust.com/v2/kyc-document-checks"
    );

    if (checkResonse.status !== 201) {
      return {
        status: checkResonse.status,
        message: checkResonse.response,
      };
    }

    const kycDocumentId = checkResonse.data.data.id;
    // Second part of Staging KYC Approval
    const verifyResponse: any = await sendRequest(
      `https://sandbox.primetrust.com/v2/kyc-document-checks/${kycDocumentId}/sandbox/verify`
    );

    if (verifyResponse.status !== 200) {
      return {
        status: verifyResponse.status,
        message: verifyResponse.response,
      };
    }

    return { status: 200, response: "Staging KYC Approval Successful" };
  }

  /**
   * @description This function authenticates spreadsheet and read the data
   * @param gid GridId of sheet
   * @returns {*}
   */
  public async readSpreadSheet(gid: string = null, sheetId: string = null) {
    let document = null;
    if (sheetId) {
      document = new GoogleSpreadsheet(sheetId);
    } else {
      document = new GoogleSpreadsheet(envData.SHEET_ID);
    }
    await document.useServiceAccountAuth({
      client_email: envData.CLIENT_EMAIL,
      private_key: envData.GOOGLE_SERVICEACCOUNT_PRIVATE_KEY,
    });
    await document.loadInfo();
    const sheet = gid ? document.sheetsById[gid] : document.sheetsByIndex[0];
    await sheet.loadCells();
    let rows = await sheet.getRows();
    const rowsCount = sheet.rowCount;
    const columnsCount = sheet.columnCount;
    rows.forEach(function (element) {
      element.correctAnswer = null;
    });
    for (let i = 0; i < rowsCount; i++) {
      for (let j = 0; j < columnsCount; j++) {
        const cell = sheet.getCell(i, j);
        if (
          cell["_rawData"] &&
          cell["_rawData"]["effectiveFormat"] &&
          cell["_rawData"]["effectiveFormat"]["backgroundColor"].red !== 1
        ) {
          if (rows[cell["_row"] - 1]) {
            rows[cell["_row"] - 1].correctAnswer =
              cell["_rawData"]["formattedValue"];
          }
        }
      }
    }
    return rows;
  }

  /**
   * @description This function convert spreadsheet data to JSON by filtering with quiz #
   * @param topicId
   * @param quizNums
   * @param rows
   * @returns {*}
   */
  public async convertSpreadSheetToJSON(
    topicId: string,
    quizNums: any,
    rows: any,
    allTopics: any
  ) {
    rows = rows.filter((x) => quizNums.includes(x["Quiz #"]));
    let lastQuizName = "";
    let lastQuizImage = "";
    let lastQuizCategory = "";
    let lastQuizStage = "";
    let lastQuizTags = "";
    let quizContentData = [];
    let questionDataArray = [];
    let order = 1;
    let categories = [];
    let filterCategory = [];
    await Promise.all(
      await rows.map(async (data, index) => {
        if (data["Quiz Title"] != "") {
          lastQuizName = data["Quiz Title"].trimEnd();
          lastQuizImage = data["Quiz Image"];
        }
        if (data["Category"] != "") {
          lastQuizCategory = data["Category"].trimEnd();
        }
        if (data["Stage"] != "") {
          lastQuizStage = data["Stage"].trimEnd();
        }
        if (data["Tags"] && data["Tags"] != "") {
          let tags = data["Tags"].split(",");
          tags = tags.map((data) => {
            data = data.trim();
            return data;
          });
          lastQuizTags = tags.join(",");
        }
        if (data["Quiz Title"] == "") {
          ++order;
        } else {
          order = 1;
        }
        let questionData = {
          text: data["Question"].trimEnd(),
          question_image: null,
          order: order,
          points: 10,
          question_type: 2,
          answer_type: 2,
          answer_array: [
            {
              name: data["A"].trimEnd(),
              image: data["Image A"],
              correct_answer: data["correctAnswer"] == data["A"] ? 1 : 0,
              statement:
                data["correctAnswer"] == data["A"]
                  ? data["Explanation"].trimEnd()
                  : null,
            },
            {
              name: data["B"].trimEnd(),
              image: data["Image B"],
              correct_answer: data["correctAnswer"] == data["B"] ? 1 : 0,
              statement:
                data["correctAnswer"] == data["B"]
                  ? data["Explanation"].trimEnd()
                  : null,
            },
            {
              name: data["C"].trimEnd(),
              image: data["Image C"],
              correct_answer: data["correctAnswer"] == data["C"] ? 1 : 0,
              statement:
                data["correctAnswer"] == data["C"]
                  ? data["Explanation"].trimEnd()
                  : null,
            },
            {
              name: data["D"].trimEnd(),
              image: data["Image D"],
              correct_answer: data["correctAnswer"] == data["D"] ? 1 : 0,
              statement:
                data["correctAnswer"] == data["D"]
                  ? data["Explanation"].trimEnd()
                  : null,
            },
          ],
        };
        questionDataArray.push(questionData);
        if (
          rows[index + 1] == undefined ||
          rows[index + 1]["Quiz #"] !== data["Quiz #"]
        ) {
          if (lastQuizCategory) {
            const isCategoryExists = allTopics.find(
              (x) => x.topic == lastQuizCategory
            );
            if (!isCategoryExists) {
              categories.push({
                topic: lastQuizCategory,
                image: null,
                status: 1,
                type: 2,
              });
              filterCategory.push({
                key: data["Quiz #"],
                value: lastQuizCategory,
              });
              topicId = null;
            } else {
              topicId = isCategoryExists._id;
            }
          }
          let quizData = {
            topicId: topicId,
            quizNum: data["Quiz #"].trimEnd(),
            quizName: lastQuizName,
            image: lastQuizImage,
            stageName: lastQuizStage,
            tags: lastQuizTags,
            questionData: questionDataArray,
          };
          quizContentData.push(quizData);
          questionDataArray = [];
        }
      })
    );
    if (categories.length > 0) {
      categories = Array.from(
        new Set(categories.map((item) => item.topic))
      ).map((topic) => categories.find((item) => item.topic === topic));
      const createdCategories = await QuizTopicTable.insertMany(categories);
      quizContentData.map((quizData) => {
        if (quizData.topicId == null) {
          const checkIfCategoryMatched = filterCategory.find(
            (x) => x.key == quizData.quizNum
          );
          if (checkIfCategoryMatched) {
            const filteredCategory = createdCategories.find(
              (x) => x.topic == checkIfCategoryMatched.value
            );
            if (filteredCategory) {
              quizData.topicId = filteredCategory._id;
            }
          }
        }
      });
    }
    return quizContentData;
  }

  /**
   * @description This function is used to add the json to db
   * @param quizContentData
   */
  public async addQuizContentsToDB(quizContentData) {
    try {
      let quizQuestions = [];
      await Promise.all(
        quizContentData.map(async (data: any) => {
          const quizNum = isNaN(parseInt(data.quizNum))
            ? null
            : parseInt(data.quizNum);
          if (!quizNum) return false;
          const quiz = await QuizTable.findOneAndUpdate(
            { quizNum: quizNum, quizType: data.quizType },
            {
              $set: {
                quizName: data.quizName,
                topicId: data.topicId,
                image: data.image,
                tags: data.tags,
                stageId: null,
                quizType: data.quizType || QUIZ_TYPE.NORMAL,
                characterName: data.characterName || null,
                characterImage: data.characterImage || null,
                categoryId: data.categoryId,
                company: data.company,
                pronouns: data.pronouns,
              },
            },
            { upsert: true, new: true }
          );
          data.questionData = data.questionData.map((questions) => {
            let bulkWriteObject = {
              updateOne: {
                filter: { quizId: quiz._id, order: questions.order },
                update: {
                  $set: { ...questions, quizId: quiz._id },
                },
                upsert: true,
              },
            };
            quizQuestions.push(bulkWriteObject);
          });
        })
      );
      // /**
      //  * Create Quiz Question
      //  */
      const questions = await QuizQuestionTable.bulkWrite(quizQuestions);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * @description This function is used to add the json category contents to db
   * @param quizCategoryData
   */
  public async addQuizCategoryContentsToDB(quizCategoryData: any) {
    try {
      let quizCategoryQuery = [];
      let currentTopic = null;
      let currentCategory = null;
      let currentDescrition = null;
      let categoryOrder = 0;
      for (let data of quizCategoryData) {
        if (!data["Topic#"] || !data["Category"]) {
          continue;
        }
        if (data["Topic"] && currentTopic != data["Topic"]?.trimEnd()) {
          currentTopic = await QuizTopicTable.findOne({
            order: parseInt(data["Topic#"]?.trimEnd()),
          });
          categoryOrder = 0;
        }
        if (!currentTopic) {
          continue;
        }
        if (currentCategory != data["Category"].trimEnd()) {
          categoryOrder += 1;
          currentCategory = data["Category"].trimEnd();
          currentDescrition = data["Description"].trimEnd();
          let bulkWriteObject = {
            updateMany: {
              filter: {
                topicId: currentTopic._id,
                order: categoryOrder,
              },
              update: {
                $set: {
                  topicId: currentTopic._id,
                  order: categoryOrder,
                  title: currentCategory,
                  description: currentDescrition,
                  levels: `Level ${categoryOrder * 5 - 4}-${categoryOrder * 5}`,
                },
              },
              upsert: true,
            },
          };
          quizCategoryQuery.push(bulkWriteObject);
        }
      }
      await QuizCategoryTable.bulkWrite(quizCategoryQuery);
      return { isAddedToDB: true, data: quizCategoryQuery };
    } catch (err) {
      return { isAddedToDB: false, data: null, message: err.mesage };
    }
  }

  /**
   * @description This function is used to get parent-child pairs
   * @param
   */
  public async getParentChildRecords() {
    let parentChildRecords = await ParentChildTable.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "teens.childId",
          foreignField: "_id",
          as: "teensData",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "parentData",
        },
      },
      {
        $unwind: {
          path: "$parentData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          parentData: {
            $ne: null,
            $exists: true,
          },
        },
      },
      {
        $redact: {
          $cond: {
            if: {
              $and: [
                {
                  $gt: [
                    {
                      $size: "$teensData",
                    },
                    0,
                  ],
                },
              ],
            },
            then: "$$KEEP",
            else: "$$PRUNE",
          },
        },
      },
      {
        $unwind: {
          path: "$teensData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          TimeBetweenCreation: 0,
        },
      },
      {
        $project: {
          _id: 0,
          ParentCreationTime: "$parentData.createdAt",
          TeenCreationTime: "$teensData.createdAt",
          ParentName: {
            $cond: {
              if: {
                $eq: ["$parentData.lastName", null],
              },
              then: "$parentData.firstName",
              else: {
                $concat: ["$parentData.firstName", " ", "$parentData.lastName"],
              },
            },
          },
          TeenName: {
            $cond: {
              if: {
                $eq: ["$teensData.lastName", null],
              },
              then: "$teensData.firstName",
              else: {
                $concat: ["$teensData.firstName", " ", "$teensData.lastName"],
              },
            },
          },
          ParentNumber: "$parentData.mobile",
          TeenNumber: "$teensData.mobile",
          WhoComesFirst: {
            $cond: [
              {
                $gte: ["$teensData.createdAt", "$parentData.createdAt"],
              },
              "Teen",
              "Parent",
            ],
          },
          TimeBetweenCreation: 1,
        },
      },
    ]).exec();
    if (parentChildRecords.length === 0) {
      throw new NetworkError("No Parent Child Record Exists", 400);
    }
    for await (let data of parentChildRecords) {
      const parentTime = moment(data.ParentCreationTime).unix();
      const teenTime = moment(data.TeenCreationTime).unix();
      let timeDiff =
        data.WhoComesFirst === "Teen"
          ? teenTime - parentTime
          : parentTime - teenTime;
      timeDiff = timeDiff / 60;
      data.TimeBetweenCreation = timeDiff;
    }
    return parentChildRecords;
  }

  /**
   * @description This function is used to convert data to csv
   * @param ctx
   * @param parentChildRecords
   * @param fields
   */
  public async convertDataToCsv(
    ctx: any,
    parentChildRecords: any,
    fields: string[]
  ) {
    const filePath = `uploads/${moment().unix()}.csv`;
    const csv = json2csv.parse(parentChildRecords, fields);
    const combinedStream = new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk);
      },
    });
    await new Promise(async (resolve, reject) => {
      combinedStream.pipe(fs.createWriteStream(filePath));
      combinedStream.write(csv);
      combinedStream.end();
      combinedStream.on("error", (err) => {
        reject(err);
      });
      combinedStream.on("finish", function () {
        ctx.attachment(filePath);
        ctx.type = "text/csv";
        ctx.body = fs.createReadStream(filePath);
        resolve(true);
      });
    });

    return ctx;
  }

  /**
   * @dscription This method will delete all quiz based on quiznums from request
   * @param quizNums
   * @return {*}
   */
  public async removeQuizFromDb(quizNums: any) {
    let mainQuery = [];
    let quizQuery = [];
    quizNums = [...new Set(quizNums)];
    await Promise.all(
      await quizNums.map(async (quizNum) => {
        const quizIfExists = await QuizTable.findOne({
          quizNum: parseInt(quizNum),
        });

        if (!quizIfExists) return false;
        mainQuery.push(quizIfExists._id);
        quizQuery.push(quizIfExists._id);
      })
    );
    await QuizQuestionTable.deleteMany({ quizId: { $in: quizQuery } });
    await QuizQuestionResult.deleteMany({ quizId: { $in: quizQuery } });
    await QuizResult.deleteMany({ quizId: { $in: quizQuery } });
    await QuizTable.deleteMany({ _id: { $in: mainQuery } });
    return true;
  }

  /**
   * @description This function is used to get users with 7+ quizzes in 60 days
   * @param
   */
  public async getMaximumQuizPlayedUsers() {
    const todayDate = moment().startOf("day").valueOf();
    const user = await QuizResult.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(todayDate - 60 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalQuizzesCompleted: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          totalQuizzesCompleted: {
            $gte: 7,
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { totalQuizzesCompleted: -1 },
      },
      {
        $project: {
          _id: 0,
          FullName: {
            $cond: {
              if: {
                $eq: ["$userData.lastName", null],
              },
              then: "$userData.firstName",
              else: {
                $concat: ["$userData.firstName", " ", "$userData.lastName"],
              },
            },
          },
          Email: "$userData.email",
          Mobile: "$userData.mobile",
          TotalQuizPlayed: "$totalQuizzesCompleted",
          CreatedAt: "$userData.createdAt",
        },
      },
    ]).exec();
    if (user.length === 0) {
      throw new NetworkError("No User Exists", 400);
    }
    return user;
  }

  /**
   * @description This function is add simulations into db
   * @param rows
   * @param topic
   * @param stages
   */
  public async convertSimulationSpreadSheetToJSON(
    topicId: any,
    simulationNums: any,
    rows: any,
    allTopics: any
  ) {
    try {
      rows = rows.filter((x) => simulationNums.includes(x["Simulation #"]));
      let simulationTitle = "";
      let simulationImage = "";
      let lastQuizCategory = "";
      let lastQuizStage = "";
      let order = 1;
      let characterName = "";
      let characterImage = "";
      let categories = [];
      let simulationContentData = [];
      let questionDataArray = [];
      let filterCategory = [];
      const prompts = ["A", "B", "C", "D"];
      await Promise.all(
        await rows.map(async (data, index) => {
          if (data["Simulation Title"] != "") {
            const titleData = data["Simulation Title"].trimEnd().split("NEW: ");
            if (titleData?.length > 1 && titleData[0] == "") {
              simulationTitle = `Simulation: ${titleData[1]}`;
            } else {
              simulationTitle = `Simulation: ${titleData[0]}`;
            }
          }
          if (data["Simulation Image"] != "") {
            simulationImage = data["Simulation Image"].trimEnd();
          }
          if (data["Category"] != "") {
            lastQuizCategory = data["Category"].trimEnd();
          }
          if (data["Stage"] != "") {
            lastQuizStage = data["Stage"].trimEnd();
          }
          if (data["Character"] != "") {
            characterName = data["Character"].trimEnd();
          }
          if (data["Character Image"] != "") {
            characterImage = data["Character Image"].trimEnd();
          }
          if (data["Simulation Title"] == "") {
            ++order;
          } else {
            order = 1;
          }
          let questionData = {
            text: data["Prompt"].trimEnd(),
            question_image: null,
            order: order,
            points: CORRECT_ANSWER_FUEL_POINTS.SIMULATION,
            question_type: 2,
            answer_type: 2,
            answer_array: prompts.map((prompt) => ({
              name: data[`Option ${prompt}`].trimEnd().split("*")[0],
              image: null,
              correct_answer:
                data[`Option ${prompt}`].trimEnd().split("*").length > 1
                  ? 1
                  : 0,
              statement: data[`Response ${prompt}`],
            })),
            correctStatement: data["Response if correct"],
            incorrectStatement: data["Response if incorrect"],
          };
          questionDataArray.push(questionData);
          if (
            rows[index + 1] == undefined ||
            rows[index + 1]["Simulation #"] !== data["Simulation #"]
          ) {
            let quizData = {
              topicId: topicId,
              quizNum: data["Simulation #"].trimEnd(),
              quizName: simulationTitle,
              image: simulationImage,
              quizType: QUIZ_TYPE.SIMULATION,
              stageName: lastQuizStage,
              characterName: characterName,
              characterImage: characterImage,
              tags: null,
              questionData: questionDataArray,
            };
            simulationContentData.push(quizData);
            questionDataArray = [];
          }
        })
      );
      if (categories.length > 0) {
        categories = Array.from(
          new Set(categories.map((item) => item.topic))
        ).map((topic) => categories.find((item) => item.topic === topic));
        const createdCategories = await QuizTopicTable.insertMany(categories);
        simulationContentData.map((quizData) => {
          if (quizData.topicId == null) {
            const checkIfCategoryMatched = filterCategory.find(
              (x) => x.key == quizData.quizNum
            );
            if (checkIfCategoryMatched) {
              const filteredCategory = createdCategories.find(
                (x) => x.topic == checkIfCategoryMatched.value
              );
              if (filteredCategory) {
                quizData.topicId = filteredCategory._id;
              }
            }
          }
        });
      }
      return simulationContentData;
    } catch (error) {
      throw new NetworkError("Something Went Wrong", 400);
    }
  }

  public generateImages = async (
    descriptions: IPromptData[],
    questions: IPromptData[],
    outputPath: any
  ) => {
    // @@TODO: This process takes a very long time. We want to offload this job to a different worker in the future.
    if (descriptions.length) {
      for (let i = 0; i < descriptions.length; i++) {
        await this.getImage(STORY_QUESTION_TYPE.DESCRIPTION, descriptions[i]);
      }
    }
    if (questions.length) {
      for (let i = 0; i < questions.length; i++) {
        await this.getImage(STORY_QUESTION_TYPE.QUESTION, questions[i]);
      }
    }
    // Added a delay to avoid immediate deletion and wait for the images to be uploaded on AWS-S3
    await delay(3000);
    fs.rmdirSync(outputPath, { recursive: true });
  };

  public generatePrompt = async (
    descriptions: IPromptData[],
    questions: IPromptData[]
  ) => {
    try {
      if (descriptions.length) {
        const myDescriptions = descriptions
          .map(
            (obj, index) =>
              `Story Phrase ${index + 1}: ${obj.promptDescription}`
          )
          .join("\n");
        let descriptionImagePrompts = await this.generateImagePrompts(
          IMAGE_GENERATION_PROMPTS.STORY_MAIN_IMAGES,
          myDescriptions
        );
        descriptionImagePrompts = JSON.parse(descriptionImagePrompts);
        for (let i = 0; i < descriptions.length; i++) {
          descriptions[i].prompt = descriptionImagePrompts[i];
        }
      }

      if (questions.length) {
        const myQuestions = questions
          .map((obj) => obj.promptDescription)
          .filter((description) => !!description);
        for (let i = 0; i < myQuestions.length; i++) {
          const questionImagePrompt = await this.generateImagePrompts(
            IMAGE_GENERATION_PROMPTS.STORY_MC_AND_QUIZ_IMAGES,
            myQuestions[i]
          );
          questions[i].prompt = questionImagePrompt;
        }
      }
      return { descriptionPrompts: descriptions, questionPrompts: questions };
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  };

  /**
   * @description This function is add simulations into db
   * @param rows
   * @param topic
   * @param stages
   */
  public async convertStorySpreadSheetToJSON(storyNums: any, rowData: any) {
    const fallbackQuizTopic = new ObjectId("6594011ab1fc7ea1f458e8c8");
    try {
      let storyTitle = "";
      let lastStoryStage = "";
      let order = 0;
      let descriptionNum = 0;
      let storyContentData = [];
      let questionDataArray = [];
      let questionData = null;
      let currentStoryNumber = 0;
      let questionNum = 0;
      let company = "";
      let pronouns = [];
      let promptList: {
        [storyNumber: number]: {
          descriptions: IPromptData[];
          questions: IPromptData[];
        };
      } = {};

      // ---------- IMAGE GENERATION ----------- \\

      const outputPath = path.join(__dirname, `/midJourneyImages`);
      if (fs.existsSync(outputPath)) {
        fs.rmdirSync(outputPath, { recursive: true });
      }
      fs.mkdirSync(outputPath);
      await Promise.all(
        storyNums.map(async (storyNum) => {
          let data = rowData[storyNum];
          let imagePromptsData = rowData[`Image Prompts ${storyNum}`];
          let imageNamesData = rowData[`Image Names ${storyNum}`];
          const storyNumber = Number(data["Story Number"]);
          if (!(storyNumber in promptList)) {
            promptList[storyNumber] = {
              descriptions: [],
              questions: [],
            };
          }
          imagePromptsData["Screen Text"].map((prompt, index) => {
            const storyImageName = imageNamesData["Screen Text"][index];
            const desc: IPromptData = {
              promptDescription: data["Screen Text"][index]?.trimEnd(),
              promptStyle: "",
              prompt: prompt,
              imageName: `s${storyNumber}_d${index + 1}`,
            };
            if (storyImageName) {
              desc.isNameOverride = true;
              desc.imageName = storyImageName;
            }
            if (desc.prompt) promptList[storyNumber].descriptions.push(desc);
          });
          const prompts = ["1", "2", "3", "4"];
          prompts.map((questionNum) => {
            const promptData: IPromptData[] = prompts.map((promptKey) => {
              const questionImageName =
                imageNamesData[`Q${questionNum} A${promptKey}`]?.trimEnd();
              const question: IPromptData = {
                promptDescription:
                  data[`Q${questionNum} A${promptKey}`]?.trimEnd(),
                promptStyle: "",
                prompt: imagePromptsData[`Q1 A${promptKey}`],
                imageName: `s${storyNumber}_q1_a${promptKey}`,
              };
              if (questionImageName) {
                question.isNameOverride = true;
                question.imageName = questionImageName;
              }
              return question;
            });
            if (questionNum == "1")
              promptList[storyNumber].questions.push(...promptData);
          });
        })
      );

      const descriptions: IPromptData[] = [];
      const questions: IPromptData[] = [];
      Object.values(promptList).forEach((value) => {
        descriptions.push(
          ...value.descriptions.filter((desc) => Object.keys(desc).length > 0)
        );
        questions.push(
          ...value.questions.filter(
            (question) => Object.keys(question).length > 0
          )
        );
      });

      this.generateImages(descriptions, questions, outputPath);

      // ---------- TEXT CONTENT ----------- \\

      await Promise.all(
        await storyNums.map(async (storyNum: string, index: number) => {
          let data = rowData[storyNum];
          const storyNumber = Number(data["Story Number"]);
          const MAX_STORY_SLIDES = data["Screen Text"].length - 1;
          let imageNamesData = rowData[`Image Names ${storyNum}`];
          if (currentStoryNumber != storyNumber) {
            currentStoryNumber = storyNumber;
            descriptionNum = 0;
            questionNum = 0;
            company = data["Company"]?.trimEnd().split('"')[1];
            pronouns = [
              data["Pronoun 1"]?.trimEnd(),
              data["Pronoun 2"]?.trimEnd(),
            ];
            storyTitle = data["Story Name"]?.trimEnd();
            order = 0;
          }
          while (
            descriptionNum <= MAX_STORY_SLIDES &&
            data[`Screen Text`][order]
          ) {
            descriptionNum++;
            order++;
            const questionImageName = data["Screen Text Image"];
            questionData = {
              text: data[`Screen Text`][order - 1]?.trimEnd(),
              order: order,
              question_image:
                questionImageName || `s${storyNumber}_d${descriptionNum}.webp`,
              points: 0,
              question_type: 4,
              answer_type: null,
              answer_array: null,
              correctStatement: null,
              incorrectStatement: null,
            };
            questionDataArray.push(questionData);
          }
          const questions = ["1", "2", "3", "4"];
          questions.map((question) => {
            questionNum++;
            const prompts = ["1", "2", "3", "4"];
            questionData = {
              text: data[`Question ${question}`]?.trimEnd(),
              order: ++order,
              question_image: null,
              points: CORRECT_ANSWER_FUEL_POINTS.STORY,
              question_type: 2,
              answer_type: 2,
              answer_array: prompts.map((prompt) => {
                const answerText = data[`Q${question} A${prompt}`]?.trimEnd();
                const isCorrect = answerText.split("*").length > 1;
                return {
                  name: isCorrect ? answerText.split("*")[0] : answerText,
                  image:
                    imageNamesData[`Q${question} A${prompt}`]?.trimEnd() ||
                    `s${storyNumber}_q${1}_a${prompt.toLowerCase()}.webp`,
                  correct_answer: isCorrect ? 1 : 0,
                  statement: isCorrect
                    ? data[`Q${question} Explanation`]?.trimEnd()
                    : null,
                };
              }),
              correctStatement: null,
              incorrectStatement: null,
            };
            questionDataArray.push(questionData);
          });
          let quizData = {
            topicId: fallbackQuizTopic,
            quizNum: data["Story Number"],
            quizName: storyTitle,
            image: null,
            quizType: QUIZ_TYPE.STORY,
            stageName: lastStoryStage,
            tags: null,
            company,
            pronouns,
            questionData: questionDataArray,
          };
          storyContentData.push(quizData);
          questionDataArray = [];
        })
      );
      return storyContentData;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function process the weekly challenges
   * @param rows
   * @returns {array}
   */
  public async processChecklistContent(rows: any) {
    try {
      let currentTopic = null;
      let currentCategory = null;
      let currentLevelNum = 0;
      let levelDetails = [];
      let currentLevelIndex = -1;
      let currentTopicObj = null;
      let currentCategoryObj = null;
      for (let data of rows) {
        if (data["Topic"] && currentTopic != data["Topic"]?.trimEnd()) {
          currentTopic = data["Topic"]?.trimEnd();
          currentTopicObj = await QuizTopicTable.findOne({
            topic: currentTopic,
          });
          currentLevelNum = 0;
        }
        if (data["Category"] && currentCategory != data["Category"]) {
          currentCategory = data["Category"]?.trimEnd();
          currentCategoryObj = await QuizCategoryTable.findOne({
            title: currentCategory,
          });
        }
        if (data["Level"] && currentLevelNum != data["Level"]?.trimEnd()) {
          currentLevelNum = parseInt(data["Level"]?.trimEnd());
          currentLevelIndex++;
          levelDetails.push({
            topicId: currentTopicObj?._id || null,
            categoryId: currentCategoryObj?._id || null,
            level: currentLevelNum,
            title: data["Level Name"]?.trimEnd(),
            actions: [],
          });
        }
        let type = null;
        let currentReward = null;
        let currentQuizId = null;

        if (data["Type"]?.trimEnd() == "summary") {
          type = 4;
          currentReward = null;
        } else if (Number(parseInt(data["Identifier"]?.trimEnd()))) {
          const quizNum = data["Identifier"]?.trimEnd();
          let quizType = 0;
          if (data["Type"] == "simulation") {
            quizType = 2;
          } else if (data["Type"] == "story") {
            quizType = 3;
          } else {
            quizType = 1;
          }
          const quizId = await QuizTable.findOne({
            quizNum,
            quizType,
          }).select("_id");
          currentQuizId = quizId?._id || null;
          if (data["Type"] == "simulation") {
            type = 2;
            currentReward =
              CHECKLIST_QUESTION_LENGTH.SIMULATION *
              CORRECT_ANSWER_FUEL_POINTS.SIMULATION;
          } else if (data["Type"] == "story") {
            type = 3;
            currentReward =
              CHECKLIST_QUESTION_LENGTH.STORY *
              CORRECT_ANSWER_FUEL_POINTS.STORY;
          } else {
            type = 1;
            currentReward =
              CHECKLIST_QUESTION_LENGTH.QUIZ * CORRECT_ANSWER_FUEL_POINTS.QUIZ;
          }
        }
        if (Number(parseInt(data["Identifier"]?.trimEnd())) || type == 4) {
          const action = {
            actionNum: parseInt(data["Action Order"]?.trimEnd()),
            type: type,
            quizNum: parseInt(data["Identifier"]?.trimEnd()) || null,
            quizId: currentQuizId || null,
            reward: currentReward,
          };
          levelDetails[currentLevelIndex].actions.push(action);
        }
      }
      return levelDetails;
    } catch (error) {
      throw new NetworkError(`Something Went Wrong : ${error.message}`, 400);
    }
  }

  /**
   * @description This function is add simulations into db
   * @param checklistContent
   */
  public async addChecklistContentToDB(checklistContent: any) {
    try {
      let checklistContentData = [];
      checklistContent.map(async (data: any) => {
        if (data.topicId) {
          let bulkWriteObject = {
            updateOne: {
              filter: {
                topicId: data.topicId,
                level: data.level,
                categoryId: data.categoryId,
              },
              update: {
                $set: {
                  ...data,
                },
              },
              upsert: true,
            },
          };
          checklistContentData.push(bulkWriteObject);
        }
      });
      await QuizLevelTable.bulkWrite(checklistContentData);
      return checklistContentData;
    } catch (err) {
      return false;
    }
  }

  public async getImage(questionType: number, promptData: IPromptData) {
    try {
      if (promptData.isNameOverride) {
        console.log(
          `Unable to create image due to custom image name: ${promptData.imageName}. Skipping.`
        );
        return `${promptData.imageName}.webp`;
      }
      const isImageAlreadyExist: boolean = await checkQuizImageExists(
        promptData
      );
      if (isImageAlreadyExist) {
        console.log(
          `${promptData.imageName} already exists in s3 bucket. Skipping.`
        );
        return `${promptData.imageName}.webp`;
      }
      const imagineRes = await generateImage(
        `${promptData.prompt} ${promptData.promptStyle}`,
        IMPORT_SCRIPT
      );
      if (!imagineRes) {
        throw new NetworkError("Something Went Wrong in imagineRes", 400);
      }
      const myImage = await UpscaleImage(imagineRes, 2, IMPORT_SCRIPT);
      if (!myImage) {
        throw new NetworkError("Something Went Wrong in myImage", 400);
      }
      if (myImage) {
        const outputPath = path.join(
          __dirname,
          `/midJourneyImages/${promptData.imageName}.png`
        );
        const outputPathwebp = path.join(
          __dirname,
          `/midJourneyImages/${promptData.imageName}.webp`
        );
        await downloadImage(myImage.uri, outputPath)
          .then(() => {
            console.log(`Image downloaded to ${outputPath}`);
          })
          .catch(console.error);
        if (questionType == STORY_QUESTION_TYPE.DESCRIPTION) {
          sharp(outputPath)
            .resize({ fit: "inside", width: 390, height: 518 })
            .webp({ quality: 100 })
            .toFile(outputPathwebp, (err, info) => {
              uploadQuizImages(promptData, outputPathwebp);
            });
        } else {
          sharp(outputPath)
            .resize({ fit: "inside", width: 160, height: 160 })
            .webp({ quality: 100 })
            .toFile(outputPathwebp, (err, info) => {
              uploadQuizImages(promptData, outputPathwebp);
            });
        }
      }
      return `${promptData.imageName}.webp`;
    } catch (error) {
      if (error.message.indexOf("Job with id") >= 0) {
        console.log(
          `Error occurred while generating ${promptData.imageName}.webp, trying again`
        );
        return await this.getImage(questionType, promptData);
      }
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function convert spreadsheet data to JSON by filtering with quiz # for weekly journey
   * @param quizNums
   * @param rows
   * @returns {*}
   */
  public async convertQuizSpreadSheetToJSON(
    quizNums: any,
    rows: any,
    allCategories: any
  ) {
    try {
      rows = rows.filter((x) => quizNums.includes(x["Quiz #"]));
      let lastQuizName = "";
      let lastQuizCategory = "";
      let lastQuizStage = "";
      let lastQuizTags = "";
      let quizContentData = [];
      let questionDataArray = [];
      let order = 1;
      let currentPromptStyle = null;
      let questionNumber = 0;
      let currentCategory = null;
      let currentTopic = null;
      let promptList: {
        [quizNumber: number]: {
          questions: IPromptData[];
        };
      } = {};
      const outputPath = path.join(__dirname, `/midJourneyImages`);
      if (fs.existsSync(outputPath)) {
        fs.rmdirSync(outputPath, { recursive: true });
      }
      fs.mkdirSync(outputPath);
      const prompts = ["A", "B", "C", "D"];
      await Promise.all(
        await rows.map(async (data, index) => {
          currentPromptStyle = "";
          const quizNumber = data["Quiz #"].trimEnd();
          if (!(quizNumber in promptList)) {
            promptList[quizNumber] = {
              questions: [],
            };
            questionNumber = 0;
            const currentCategoryObj =
              allCategories?.find(
                (category) => category.title == data["Category"]?.trimEnd()
              ) || allCategories?.[0];
            currentCategory = currentCategoryObj?._id || null;
            currentTopic = currentCategoryObj?.topicId || null;
          }
          questionNumber++;
          if (data["Quiz Title"] != "") {
            lastQuizName = data["Quiz Title"].trimEnd();
          }
          if (data["Category"] != "") {
            lastQuizCategory = data["Category"].trimEnd();
          }
          if (data["Stage"] != "") {
            lastQuizStage = data["Stage"].trimEnd();
          }
          if (data["Tags"] && data["Tags"] != "") {
            let tags = data["Tags"].split(",");
            tags = tags.map((data) => {
              data = data.trim();
              return data;
            });
            lastQuizTags = tags.join(",");
          }
          if (data["Quiz Title"] == "") {
            ++order;
          } else {
            order = 1;
          }

          const promptData: IPromptData[] = prompts.map((promptKey) => {
            const questionImageName = data[`Image ${promptKey}`];
            const question: IPromptData = {
              promptDescription: data[promptKey]?.trimEnd(),
              promptStyle: currentPromptStyle,
              prompt: data[`Prompt ${promptKey}`]?.trimEnd(),
              imageName: `q${quizNumber}_q${Math.ceil(
                questionNumber / 4
              )}_${promptKey.toLowerCase()}`,
            };
            if (questionImageName) {
              question.isNameOverride = true;
              question.imageName = questionImageName;
            }
            return question;
          });
          promptList[quizNumber].questions.push(...promptData);

          let questionData = {
            text: data["Question"].trimEnd(),
            question_image: null,
            order: order,
            points: CORRECT_ANSWER_FUEL_POINTS.QUIZ,
            question_type: 2,
            answer_type: 2,
            answer_array: prompts.map((prompt) => {
              const answerText = data[prompt]?.trimEnd();
              const isCorrect = answerText.split("*").length > 1;
              return {
                name: isCorrect ? answerText.split("*")[0] : answerText,
                image:
                  data[`Image ${prompt}`] ||
                  `q${data["Quiz #"]}_q${Math.ceil(
                    questionNumber / 4
                  )}_${prompt.toLowerCase()}.webp`,
                correct_answer: isCorrect ? 1 : 0,
                statement: isCorrect ? data["Explanation"].trimEnd() : null,
              };
            }),
          };
          questionDataArray.push(questionData);
          if (
            rows[index + 1] == undefined ||
            rows[index + 1]["Quiz #"] !== data["Quiz #"]
          ) {
            let quizData = {
              topicId: currentTopic,
              quizNum: data["Quiz #"].trimEnd(),
              quizName: lastQuizName,
              image: null,
              stageName: lastQuizStage,
              tags: lastQuizTags,
              questionData: questionDataArray,
              categoryId: currentCategory,
              quizType: QUIZ_TYPE.NORMAL,
            };
            quizContentData.push(quizData);
            questionDataArray = [];
          }
        })
      );

      const questions: IPromptData[] = [];
      Object.values(promptList).forEach((value) => {
        questions.push(
          ...value.questions.filter(
            (question) => Object.keys(question).length > 0 && question.prompt
          )
        );
      });
      this.generateImages([], questions, outputPath);
      return quizContentData;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function create new records for weekly-rewards for existing users
   * @returns {*}
   */
  public async updateWeeklyRewardStatus() {
    const [day7Challenges, day1Challenges] = await Promise.all([
      WeeklyJourneyTable.find({
        $or: [{ week: 1 }, { week: 2 }, { week: 3 }],
        day: 7,
      }).sort({ week: 1 }),
      WeeklyJourneyTable.find({
        $or: [{ week: 2 }, { week: 3 }, { week: 4 }],
        day: 1,
      }).sort({ week: 1 }),
    ]);
    let newRecords = [];

    day7Challenges.map(async (day7Challenge, idx) => {
      const deletedRecords = await WeeklyJourneyResultTable.deleteMany({
        weeklyJourneyId: `${day7Challenge._id}`,
      });
      let userDetails = await WeeklyJourneyResultTable.aggregate([
        {
          $match: {
            weeklyJourneyId: day1Challenges[idx]._id,
          },
        },
        {
          $group: {
            _id: "$userId",
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
          },
        },
        {
          $group: {
            _id: null,
            users: {
              $push: {
                userId: "$_id",
                createdAt: "$createdAt",
                updatedAt: "$updatedAt",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            users: 1,
          },
        },
      ]).exec();
      let users = userDetails[0]?.users;
      if (users?.length) {
        for (let i = 0; i < users.length; i++) {
          let overwrittenDate = new Date(users[i].createdAt);
          overwrittenDate.setSeconds(overwrittenDate.getSeconds() - 1);
          let record = {
            updateOne: {
              filter: {
                weeklyJourneyId: `${day7Challenge._id}`,
                userId: users[i].userId,
              },
              update: {
                $set: {
                  weeklyJourneyId: `${day7Challenge._id}`,
                  userId: users[i].userId,
                  actionNum: 3,
                  actionInput: null,
                  createdAt: overwrittenDate,
                  updatedAt: overwrittenDate,
                  __v: 0,
                },
              },
              upsert: true,
              timestamps: false,
            },
          };
          newRecords.push(record);
        }
        const insertedRecords = await WeeklyJourneyResultTable.bulkWrite(
          newRecords
        );
      }
    });
    return true;
  }
  /**
   * @description this will generate suggestions using OpenAI API based on user inputs
   * @param data
   * @returns {*}
   */
  public async generateImagePrompts(systemInput: string, prompt: string) {
    try {
      const openai = new OpenAI({
        apiKey: envData.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: IMAGE_GENERATION_PROMPTS.GPT_MODEL,
        messages: [
          {
            role: SYSTEM,
            content: systemInput,
          },
          {
            role: USER,
            content: prompt,
          },
        ],
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      return JSON.parse(JSON.stringify(response.choices[0].message.content));
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function import available Coach details
   * @returns {*}
   */
  public async importCoachProfilesInDB(rows) {
    const coachProfilesMap = new Map(); // Use a Map to store coach profiles by coachId
    rows.forEach((data) => {
      const coachId = Number(data["Coach Id"].trim());
      let coachProfile = coachProfilesMap.get(coachId);
      if (!coachProfile) {
        coachProfile = {
          coachId,
          key: data["Key"].trim(),
          name: data["Name"].trim(),
          position: data["Position"].trim(),
          image: data["Image"].trim(),
          linkedIn: data["LinkedIn"].trim(),
          rating: Number(data["Rating"].trim()),
          reviews: Number(data["Reviews"].trim()),
          mobile: data["Mobile"].trim().replace(/-/g, ""),
          about: data["About"].trim(),
          skills: [],
          whyItsValuable: [],
        };
        coachProfilesMap.set(coachId, coachProfile);
      }
      coachProfile.skills.push(data["Skills"]?.trim());
      if (data["Why Its Valuable (Name)"]) {
        coachProfile.whyItsValuable.push({
          name: data["Why Its Valuable (Name)"]?.trim(),
          description: data["Why Its Valuable (Description)"]?.trim(),
          date: data["Why Its Valuable (Date)"]?.trim(),
        });
      }
    });

    const coachProfilesData = Array.from(coachProfilesMap.values()); // Extract values from the Map
    const bulkWriteOperations = coachProfilesData.map((data) => ({
      updateOne: {
        filter: { key: data.key },
        update: { $set: data },
        upsert: true,
      },
    }));

    await CoachProfileTable.bulkWrite(bulkWriteOperations);
    return coachProfilesData;
  }

  /**
   * @description This function authenticates spreadsheet and read the data
   * @param gid GidId of sheet
   * @returns {*}
   */
  public async readCaseStudySpreadSheet(
    gid: string = null,
    sheetId: string = null
  ) {
    let document = null;
    if (sheetId == envData.PASSION_SHEET_ID) {
      document = new GoogleSpreadsheet(envData.PASSION_SHEET_ID);
    } else if (sheetId == envData.ACTION_SCREEN_COPY_SHEET_ID) {
      document = new GoogleSpreadsheet(envData.ACTION_SCREEN_COPY_SHEET_ID);
    } else {
      document = new GoogleSpreadsheet(envData.SHEET_ID);
    }
    await document.useServiceAccountAuth({
      client_email: envData.CLIENT_EMAIL,
      private_key: envData.GOOGLE_SERVICEACCOUNT_PRIVATE_KEY,
    });
    await document.loadInfo();
    const sheet = gid ? document.sheetsById[gid] : document.sheetsByIndex[0];
    await sheet.loadCells();
    const rowData = {};
    const headers = [];
    for (let i = 1; i < sheet.rowCount; i++) {
      headers.push(sheet.getCell(i, 0).value);
    }
    for (let i = 1; i < sheet.columnCount; i++) {
      const header = sheet.getCell(0, i).value;
      rowData[header] = {};

      // Iterate through each row in the column and extract data
      for (let j = 1; j < sheet.rowCount; j++) {
        const cellValue = sheet.getCell(j, i).value;
        const currentHeader = headers[j - 1];
        if (currentHeader === "Screen Text") {
          if (!rowData[header][currentHeader]) {
            rowData[header][currentHeader] = [];
          }
          rowData[header][currentHeader].push(cellValue);
        } else {
          rowData[header][currentHeader] = cellValue;
        }
      }
    }

    return rowData;
  }

  /**
   * @description This function convert spreadsheet data to JSON
   * @param rows
   * @returns {*}
   */
  public async convertMarketSegmentInfoSheetToJSON(rows: any) {
    const marketData = [];
    let tempData = {};

    rows.forEach((data) => {
      tempData = {
        marketSegment: data["Market Segment"],
        businessType: PRODUCT_TYPE[data["Product Type"]],
        uniqueness: {
          criteria: "Uniqueness",
          rating: data["Disruption"] * 10, // *10 to convert in percentage
          description: data["Disruption Description"],
          image: "uniqueness.png",
        },
        marketSize: {
          criteria: "Market Size",
          rating: data["Market Size"] * 10,
          description: data["Market Size Description"],
          image: "marketsize.png",
        },
        complexity: {
          criteria: "Complexity",
          rating: data["Complexity"] * 10,
          description: data["Complexity Description"],
          image: "complexity.png",
        },
      };

      marketData.push(tempData);
    });

    return marketData;
  }

  /**
   * @dscription This method add the market segment info like ragtings, description and business type
   * @param marketInfo
   * @return {boolean}
   */
  public async addMarketSegmentInfoCategory(marketInfo: any[]) {
    try {
      let marketSegmentBulkWriteQuery = [];
      marketInfo.map((data) => {
        let bulkWriteObject = {
          updateOne: {
            filter: {
              businessType: data.businessType,
              marketSegment: data.marketSegment,
            },
            update: {
              $set: {
                marketSegment: data.marketSegment,
                businessType: data.businessType,
                uniqueness: data.uniqueness,
                marketSize: data.marketSize,
                complexity: data.complexity,
              },
            },
            upsert: true,
          },
        };
        marketSegmentBulkWriteQuery.push(bulkWriteObject);
      });
      await MarketSegmentInfoTable.bulkWrite(marketSegmentBulkWriteQuery);
      return true;
    } catch (error) {
      return error;
    }
  }

  /**
   * @dscription This method fetch all case studies and update the explanation statements for its quiestions
   * @return {boolean}
   */
  public async updateAnswerExplanationStatement() {
    try {
      await QuizQuestionTable.aggregate([
        {
          $lookup: {
            from: "quiz",
            localField: "quizId",
            foreignField: "_id",
            as: "quiz_info",
          },
        },
        {
          $unwind: "$quiz_info",
        },
        {
          $match: {
            "quiz_info.quizType": 3,
            "quiz_info.updatedAt": {
              $gt: new Date("2024-05-01T06:24:40.364Z"),
            },
            answer_type: 2,
          },
        },
        {
          $set: {
            answer_array: {
              $map: {
                input: "$answer_array",
                as: "answer",
                in: {
                  $mergeObjects: [
                    "$$answer",
                    {
                      statement: {
                        $cond: [
                          { $eq: ["$$answer.correct_answer", 1] },
                          "$correctStatement",
                          "$$answer.statement",
                        ],
                      },
                    },
                  ],
                },
              },
            },
            correctStatement: null,
            incorrectStatement: null,
          },
        },
        {
          $unset: "quiz_info",
        },
        {
          $merge: {
            into: "quizquestions",
            whenMatched: "merge",
            whenNotMatched: "discard",
          },
        },
      ]);

      return true;
    } catch (error) {
      return error;
    }
  }

  /**
   * @description This function convert problem score spreadsheet data to JSON
   * @param rows
   * @param type 1=physical, 2=software
   * @returns {*}
   */
  public async addProblemScoringDataToDB(rows: any, type: number) {
    try {
      let problemScoresData = [];
      let problemDetails = null;
      rows.forEach((data) => {
        if (data["Problem"] && data["Explanation 1"]?.trim()) {
          problemDetails = {
            type,
            problem: data["Problem"]?.trim(),
            pricePointIndex: Number(data["Price Point Index"]?.trim()),
            pricePointExplanation: data["Explanation 1"]?.trim(),
            demandScore: Number(data["Demand Score"]?.trim()),
            demandScoreExplanation: data["Explanation 2"]?.trim(),
            trendingScore: Number(data["Trending Score"]?.trim()),
            trendingScoreExplanation: data["Explanation 3"]?.trim(),
            overallRating: Number(data["Overall Rating"]?.trim()),
          };
        }
        problemScoresData.push(problemDetails);
      });

      const bulkWriteOperations = problemScoresData.map((data) => ({
        updateOne: {
          filter: { type: data.type, problem: data.problem },
          update: { $set: data },
          upsert: true,
        },
      }));

      await ProblemScoreTable.bulkWrite(bulkWriteOperations);
      return problemScoresData;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function convert problem score spreadsheet data to JSON
   * @param rows
   * @param type 1=physical, 2=software
   * @returns {*}
   */
  public async addMarketScoringDataToDB(rows: any, type: number) {
    try {
      let marketScoresData = [];
      let marketDetails = null;
      rows.forEach((data) => {
        if (data["Market Segment"]) {
          marketDetails = {
            type,
            marketSegment: data["Market Segment"]?.trim(),
            hhiRating: Number(data["HHI Rating"]?.trim()),
            hhiExplanation: data["HHI Explanation"]?.trim(),
            customerSatisfactionRating: Number(
              data["Customer Satisfaction Rating"]?.trim()
            ),
            customerSatisfactionExplanation:
              data["Customer Satisfaction Explanation"]?.trim(),
            ageIndexRating: Number(data["Age Index Rating"]?.trim()),
            ageIndexExplanation: data["Age Index Explanation"]?.trim(),
            tamRating: Number(data["TAM Rating"]?.trim()),
            tamExplanation: data["TAM Explanation"]?.trim(),
            cagrRating: Number(data["CAGR Rating"]?.trim()),
            cagrExplanation: data["CAGR Explanation"]?.trim(),
            overallRating: Number(data["Total Rating"]?.trim()),
          };
        }
        marketScoresData.push(marketDetails);
      });

      const bulkWriteOperations = marketScoresData.map((data) => ({
        updateOne: {
          filter: { type: data.type, marketSegment: data.marketSegment },
          update: { $set: data },
          upsert: true,
        },
      }));

      await MarketScoreTable.bulkWrite(bulkWriteOperations);
      return marketScoresData;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function convert spreadsheet data to JSON by filtering with key referring the action to be performed
   * @param rows
   * @returns {*}
   */
  public async convertOpenAIDatasetSheetToJSON(rows: any) {
    try {
      const result = {};
      const types = {};
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const key = row.key;
        const objectSize = row.objectSize;
        const dataset = row.dataset;

        if (objectSize > 0) {
          const obj = {};
          const typeObj = {};
          for (let j = 0; j < objectSize; j++) {
            const currentRow = rows[i + j];
            if (currentRow.name && currentRow.dataset) {
              if (currentRow.datasetSplit == "TRUE") {
                obj[
                  currentRow.name
                ] = `${currentRow.dataset} ${currentRow.dataset2}`;
              } else {
                obj[currentRow.name] = currentRow.dataset;
              }
            }
            typeObj[j + 1] = currentRow.name;
          }
          result[key] = obj;
          types[key] = typeObj;
          i += objectSize - 1;
        } else if (key && dataset) {
          result[key] = dataset;
        }
      }
      return { result, types };
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function convert problem score spreadsheet data to JSON
   * @param openAIDataset
   * @returns {*}
   */
  public async addOpenAIDataToDB(openAIDataset: any) {
    let datasetContent = [];
    let typeContent = [];
    try {
      for (const [key, value] of Object.entries(openAIDataset.result)) {
        let type = 0;
        if (key == "physicalProduct") {
          type = 1;
        } else if (key == "softwareTechnology") {
          type = 2;
        } else if (key == "ideaValidation") {
          type = 3;
        }
        let bulkWriteObject = {
          updateOne: {
            filter: {
              key,
              type,
            },
            update: {
              $set: {
                type,
                key,
                data: value,
              },
            },
            upsert: true,
          },
        };
        datasetContent.push(bulkWriteObject);
      }
      await AIToolDataSetTable.bulkWrite(datasetContent);

      const datasetDetails = await AIToolDataSetTable.find(
        {},
        { key: 1, _id: 1 }
      );

      for (const [key, types] of Object.entries(openAIDataset.types)) {
        const dataset = datasetDetails.find((obj) => obj.key == key);
        let bulkWriteTypeObject = {
          updateOne: {
            filter: { key },
            update: {
              $set: { key, types, datasetId: dataset._id },
            },
            upsert: true,
          },
        };
        typeContent.push(bulkWriteTypeObject);
      }

      await AIToolDataSetTypesTable.bulkWrite(typeContent);
      return "Dataset Updated";
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function convert Milestone spreadsheet to JSON
   * @param rows
   * @returns {*}
   */
  public async convertMilestoneDatasetSheetToJSON(rows: any) {
    try {
      const result = [];
      let milestoneContent = [],
        stageContent = [];
      let currentMilestone = null;
      let currentDay = 0;
      let order = 0;
      let currentMilestoneId = null;
      let currentIndex = -1;
      let currentIdentifier = null;
      let milestoneOrder = 0;
      let learningContent = [];
      let learningContentIdx = -1;
      let dayTitle = null;
      let roadmapIcon = null;
      let resultCopyInfo = null;
      const defaultTopic = "6638c5f713b74c3154c67624";
      const stageArray = rows.reduce((acc, row) => {
        const milestone = row.milestone?.trimEnd();
        if (milestone?.length > 1) {
          acc.push({
            title: row["Stage"],
          });
        }
        return acc;
      }, []);
      stageArray.forEach((stage) => {
        let bulkWriteObject = {
          updateOne: {
            filter: {
              title: stage.title,
            },
            update: {
              $set: {
                title: stage.title,
                reward: MILESTONE_STAGE_REWARDS[stage.title]?.token || 0,
                order: MILESTONE_STAGE_REWARDS[stage.title]?.order || 0,
                type: 1,
              },
            },
            upsert: true,
          },
        };
        stageContent.push(bulkWriteObject);
      });
      await StageTable.bulkWrite(stageContent);
      const [quizTopics, stages] = await Promise.all([
        QuizTopicTable.find({ type: 4 }).lean(),
        StageTable.find({}, { title: 1 }).lean(),
      ]);
      const milestonesArray = rows.reduce((acc, row) => {
        const topic = row.topic?.trimEnd();
        const milestone = row.milestone?.trimEnd();
        if (milestone?.length > 1) {
          acc.push({
            milestone: milestone,
            topicId:
              quizTopics.find((obj) => obj.topic == topic)?._id || defaultTopic,
            description: "7 Days - 15 min/day",
            order: Number(row["order"]?.trimEnd()),
            locked: row["locked"]?.trimEnd() == "TRUE" ? true : false,
            icon: row["milestoneIcon"]?.trimEnd() || null,
            iconBackgroundColor:
              row["milestoneIconBGColor"]?.trimEnd() || "#ffffff19",
            stageId: stages.find((obj) => obj.title == row["Stage"]?.trimEnd()),
          });
        }
        return acc;
      }, []);
      milestonesArray.forEach((goal) => {
        let bulkWriteObject = {
          updateOne: {
            filter: {
              milestone: goal.milestone,
            },
            update: {
              $set: {
                milestone: goal.milestone,
                topicId: goal.topicId,
                description: goal.description,
                order: goal.order,
                locked: goal.locked,
                icon: goal.icon,
                iconBackgroundColor: goal.iconBackgroundColor,
                stageId: goal.stageId,
              },
            },
            upsert: true,
          },
        };
        milestoneContent.push(bulkWriteObject);
      });
      await MilestoneTable.bulkWrite(milestoneContent);
      const milestoneDetails = await MilestoneTable.find();
      let milestoneIdMap = {};
      milestoneDetails.forEach((obj) => {
        milestoneIdMap[obj.milestone] = obj._id;
      });
      for (const row of rows) {
        if (row["milestone"] && row["milestone"] != currentMilestone) {
          currentMilestone = row["milestone"].trimEnd();
          currentMilestoneId = milestoneIdMap[currentMilestone];
        }

        if (row["day"] && row["day"] != currentDay) {
          currentDay = Number(row["day"]);
          dayTitle = row["title"]?.trimEnd() || null;
          roadmapIcon = row["roadmapIcon"]?.trimEnd() || null;
          order = 0;
          learningContent.push({
            milestoneId: currentMilestoneId || null,
            day: currentDay,
            actions: [],
          });
          learningContentIdx += 1;
        }
        const learningId =
          Number(parseInt(row["learningId"]?.trimEnd())) || null;
        const learningType = row["learningType"]?.trimEnd() || null;
        if (learningId) {
          const quizData = await this.getQuizMetaData(learningId, learningType);
          if (quizData.quizType !== 3) {
            resultCopyInfo = this.getResultCopyInfo(quizData, row);
          }
          const action = {
            type: quizData.quizType,
            quizNum: learningId,
            quizId: quizData.quizId || null,
            reward: quizData.reward,
            resultCopyInfo,
          };
          learningContent[learningContentIdx].actions.push(action);
        }
        const optionCount = Number(row["options"]?.trimEnd()) || null;
        const inputQuestion = row["userInputQuestion"]?.trimEnd();
        if (
          row["identifier"] &&
          currentIdentifier != row["identifier"]?.trimEnd()
        ) {
          const inputTemplate = {
            optionsScreenInfo: optionCount
              ? {
                  title: row["optionHeading"]?.trimEnd(),
                  options: [],
                }
              : null,
            questionScreenInfo: inputQuestion ? { title: inputQuestion } : null,
          };
          currentIndex++;
          if (row["template"]) {
            result.push({
              milestoneId: currentMilestoneId,
              day: currentDay,
              title: row["goalTitle"]?.trimEnd(),
              key: row["identifier"]?.trimEnd(),
              order: ++order,
              time: row["time"]?.trimEnd() || "AI-Assisted - 2 min",
              iconImage: row["icon"]?.trimEnd() || null,
              iconBackgroundColor:
                row["iconBackgroundColor"]?.trimEnd() || null,
              dependency: row["dependency"]?.trimEnd().split(","),
              template: Number(row["template"]?.trimEnd()),
              inputTemplate: inputTemplate,
              isAiToolbox:
                row["isAiToolbox"].trimEnd() == "TRUE" ? true : false,
              dayTitle,
              roadmapIcon,
            });
          }
        }
        if (row["optionTitle"]) {
          result[currentIndex].inputTemplate.optionsScreenInfo.options.push({
            title: row["optionTitle"]?.trimEnd(),
            description: row["optionDescription"]?.trimEnd() || null,
            type: Number(row["optionType"]?.trimEnd()),
            image: row["optionIcon"]?.trimEnd() || null,
          });
        }
      }
      return { result, learningContent };
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function convert problem score spreadsheet data to JSON
   * @param milestones
   * @returns {*}
   */
  public async addMilestoneDataToDB(milestones: any, learningContent: any) {
    let milestoneContent = [],
      learningContentData = [];
    try {
      milestones.forEach((obj) => {
        let bulkWriteObject = {
          updateOne: {
            filter: {
              milestoneId: obj.milestoneId,
              key: obj.key,
            },
            update: {
              $set: {
                milestoneId: obj.milestoneId,
                day: obj.day,
                title: obj.title,
                key: obj.key,
                order: obj.order,
                time: obj.time,
                iconImage: obj.iconImage,
                iconBackgroundColor: obj.iconBackgroundColor,
                dependency: obj.dependency,
                template: obj.template,
                inputTemplate: obj.inputTemplate,
                isAiToolbox: obj.isAiToolbox,
                dayTitle: obj.dayTitle,
                roadmapIcon: obj.roadmapIcon,
              },
            },
            upsert: true,
          },
        };
        milestoneContent.push(bulkWriteObject);
      });

      learningContent.forEach((obj) => {
        let learningBulkWriteObject = {
          updateOne: {
            filter: {
              milestoneId: obj.milestoneId,
              day: obj.day,
            },
            update: {
              $set: {
                milestoneId: obj.milestoneId,
                day: obj.day,
                actions: obj.actions,
              },
            },
            upsert: true,
          },
        };
        learningContentData.push(learningBulkWriteObject);
      });
      await Promise.all([
        MilestoneGoalsTable.bulkWrite(milestoneContent),
        QuizLevelTable.bulkWrite(learningContentData),
      ]);
      return "Dataset Updated";
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function convert Suggestion Screen Copy spreadsheet to JSON
   * It contains Screen Text for each action/goal
   * @param rows
   * @returns {*}
   */
  public async convertSuggestionScreenDataToJSON(rows: any) {
    try {
      const result = [];
      let key = null;
      for (const row of rows) {
        key = row["Key"]?.trimEnd();
        if (key) {
          result.push({
            key: key,
            name: row["Name"]?.trimEnd(),
            title: row["Title"]?.trimEnd(),
            actionName: row["Action Name"]?.trimEnd(),
            placeHolderText: row["Place Holder Text"]?.trimEnd() || null,
            maxCharLimit: row["Character Limit"]?.trimEnd(),
            isMultiLine: row["IsMultiLine"]?.trimEnd() == "TRUE" ? true : false,
            actionType: row["Action Input Type"]?.trimEnd(),
            isGrid: row["isGrid"]?.trimEnd() == "TRUE" ? true : false,
            section: row["Section"]?.trimEnd() || null,
            stepList:
              key == "ideaValidation" || key == "description"
                ? IDEA_VALIDATION_STEPS
                : null,
            saveButtonText: row["Save Button Text"] || "SAVE",
            iconImage: row["Icon"]?.trimEnd() || null,
            iconBackgroundColor: row["IconBackgroundColor"]?.trimEnd() || null,
          });
        }
      }
      return result;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function convert problem score spreadsheet data to JSON
   * @param data
   * @returns {*}
   */
  public async addSuggestionScreenDataToDB(data: any) {
    let suggestionScreenData = [];
    try {
      data.forEach((obj) => {
        let bulkWriteObject = {
          updateOne: {
            filter: {
              key: obj.key,
            },
            update: {
              $set: {
                key: obj.key,
                name: obj.name,
                title: obj.title,
                actionName: obj.actionName,
                placeHolderText: obj.placeHolderText,
                maxCharLimit: obj.maxCharLimit,
                isMultiLine: obj.isMultiLine,
                actionType: obj.actionType,
                isGrid: obj.isGrid,
                section: obj.section,
                stepList: obj.stepList,
                saveButtonText: obj.saveButtonText,
                iconImage: obj.iconImage,
                iconBackgroundColor: obj.iconBackgroundColor,
              },
            },
            upsert: true,
          },
        };
        suggestionScreenData.push(bulkWriteObject);
      });
      await SuggestionScreenCopyTable.bulkWrite(suggestionScreenData);
      return;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function update the number of goals completed already for existing users
   * @returns {*}
   */
  public async updateCompletedGoalCountInDB() {
    try {
      const businessProfiles = await BusinessProfileTable.find({}).lean(); // Get all business profiles directly

      for (let businessProfile of businessProfiles) {
        let completedGoals = 0;
        const {
          description,
          competitors,
          companyName,
          companyLogo,
          targetAudience,
          colorsAndAesthetic,
        } = businessProfile;
        if (description && description != null && description.length > 0) {
          completedGoals += 1;
        }
        if (competitors && competitors != null) {
          completedGoals += 1;
        }
        if (companyName && companyName != null) {
          completedGoals += 1;
        }
        if (companyLogo && companyLogo != null) {
          completedGoals += 1;
        }
        if (targetAudience && targetAudience != null) {
          completedGoals += 1;
        }
        if (colorsAndAesthetic && colorsAndAesthetic != null) {
          completedGoals += 1;
        }
        // Update the completedGoal count in the business profile
        await BusinessProfileTable.findOneAndUpdate(
          { _id: businessProfile._id },
          { $set: { completedGoal: completedGoals } }
        );
      }
      return;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function update the number of goals completed already for existing users
   * @returns {*}
   */
  public async updateCompletedBusinessProfileDetails() {
    try {
      const profilesToMigrate = await BusinessProfileTable.find({}).lean();
      for (let profile of profilesToMigrate) {
        let updateObj = {};
        if (profile && profile.completedGoal > 0) {
          const {
            description,
            competitors,
            companyName,
            targetAudience,
            colorsAndAesthetic,
          }: any = profile;
          if (description && !profile.idea) {
            updateObj["idea"] = description.substring(0, 40);
          }
          if (
            competitors &&
            Array.isArray(competitors) &&
            competitors.length > 0
          ) {
            const [firstCompetitor, ...remainingCompetitors] = competitors;
            const descData = [
              firstCompetitor.description,
              ...remainingCompetitors.map(
                (comp) => `${comp.title}\n${comp.description}`
              ),
            ].join("\n");

            updateObj["competitors"] = {
              title: firstCompetitor.title,
              description: descData,
            };
          } else if (competitors && typeof competitors == "string") {
            updateObj["competitors"] = {
              title: competitors.substring(0, 40),
              description: competitors,
            };
          }

          if (companyName && typeof companyName == "string") {
            updateObj["companyName"] = {
              title: companyName,
              description: " ",
            };
          }

          if (targetAudience) {
            if (targetAudience?.title && typeof targetAudience == "object") {
              updateObj["targetAudience"] = {
                title: targetAudience?.title,
                description: JSON.stringify(targetAudience?.description),
              };
            } else if (targetAudience && typeof targetAudience == "string") {
              updateObj["targetAudience"] = {
                title: targetAudience.substring(0, 40),
                description: targetAudience,
              };
            } else {
              updateObj["targetAudience"] = {
                title: targetAudience,
                description: " ",
              };
            }
          }

          if (colorsAndAesthetic && typeof colorsAndAesthetic == "string") {
            updateObj["colorsAndAesthetic"] = {
              title: colorsAndAesthetic.substring(0, 40),
              description: colorsAndAesthetic,
            };
          }
          await BusinessProfileTable.findOneAndUpdate(
            { userId: profile.userId },
            { $set: updateObj },
            { upsert: true }
          );
        }
      }
      return;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function remove the logo generation action from the daily challenges for all users
   * @returns {*}
   */
  public async removeLogoActionChallenge() {
    try {
      const profilesToUpdate = await DailyChallengeTable.find({}).lean();
      for (let profile of profilesToUpdate) {
        if (profile && profile.dailyGoalStatus.length > 0) {
          await DailyChallengeTable.updateOne(
            { userId: profile.userId },
            { $pull: { dailyGoalStatus: { key: "companyLogo" } } }
          );
        }
      }
      await MilestoneGoalsTable.updateOne(
        { key: "companyLogo" },
        { $set: { milestoneId: null, isAiToolbox: false } }
      );
      return;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function update the number of goals completed already for existing users
   * @returns {*}
   */
  public async updateCompletedActions() {
    try {
      const profilesToMigrate = await BusinessProfileTable.find({
        completedGoal: { $gt: 0 },
      }).lean();
      const bulkOperations = profilesToMigrate
        .map((profile) => {
          const updateObj = {};

          ACTIONS_TO_MOVE.forEach((action) => {
            if (profile[action]) {
              updateObj[action] = profile[action];
            }
          });

          if (Object.keys(updateObj).length > 0) {
            return {
              updateOne: {
                filter: { userId: profile.userId },
                update: { $set: { completedActions: updateObj } },
                upsert: true,
              },
            };
          }
        })
        .filter(Boolean);

      if (bulkOperations.length > 0) {
        await BusinessProfileTable.bulkWrite(bulkOperations);
      }
      return;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function move the used AI Tools to usedAITools object in aiToolsUsageStatus collection
   * @returns {*}
   */
  public async updateUsedAITools() {
    try {
      const profilesToMigrate = await AIToolsUsageStatusTable.find({}).lean();
      const bulkOperations = profilesToMigrate
        .map((profile) => {
          let updateObj = { description: true };

          ACTIONS_TO_MOVE.forEach((action) => {
            if (profile[action]) {
              updateObj[action] = profile[action];
            }
          });

          if (Object.keys(updateObj).length > 0) {
            return {
              updateOne: {
                filter: { userId: profile.userId },
                update: { $set: { usedAITools: updateObj } },
                upsert: true,
              },
            };
          }
        })
        .filter(Boolean);

      if (bulkOperations.length > 0) {
        await AIToolsUsageStatusTable.bulkWrite(bulkOperations);
      }
      return;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function assign default logo to the users who have already completed the company name action but do not have any logo
   * @returns {*}
   */
  public async assignDefaultLogo() {
    try {
      const profilesToUpdate = await BusinessProfileTable.find({}).lean();
      const logo = "companyLogo";
      const name = "companyName";
      const bulkOperations = profilesToUpdate
        .map((profile) => {
          const hasNameInCompletedActions = mapHasGoalKey(
            profile.completedActions,
            name
          );
          const hasLogoInCompletedActions = mapHasGoalKey(
            profile.completedActions,
            logo
          );
          if (hasNameInCompletedActions && !hasLogoInCompletedActions) {
            return {
              updateOne: {
                filter: { userId: profile.userId },
                update: {
                  $set: {
                    "completedActions.companyLogo": DEFAULT_BUSINESS_LOGO,
                  },
                },
              },
            };
          }
        })
        .filter(Boolean);
      if (bulkOperations.length > 0) {
        await BusinessProfileTable.bulkWrite(bulkOperations);
      }
      return;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  private async getQuizMetaData(quizNum: number, type: string) {
    let quizType = 0,
      reward = 0,
      quizInfo = null;
    if (type == "simulation") {
      quizType = 2;
      reward =
        CHECKLIST_QUESTION_LENGTH.SIMULATION *
        CORRECT_ANSWER_FUEL_POINTS.SIMULATION;
    } else if (type == "story") {
      quizType = 3;
      reward =
        CHECKLIST_QUESTION_LENGTH.STORY * CORRECT_ANSWER_FUEL_POINTS.STORY;
    } else if (type == "quiz") {
      quizType = 1;
      reward = CHECKLIST_QUESTION_LENGTH.QUIZ * CORRECT_ANSWER_FUEL_POINTS.QUIZ;
    } else if (type == "event") {
      quizType = 4;
      reward = 0;
    }
    if (quizType === 4) {
      quizInfo = await MilestoneEventsTable.findOne({ eventId: quizNum });
    } else {
      quizInfo = await QuizTable.findOne({ quizNum, quizType });
    }
    const quizId = quizInfo?._id || null;
    return {
      quizType,
      reward,
      quizId,
    };
  }

  /**
   * @description This function import the entrepreneur communities from the spreadsheet
   * @returns {*}
   */
  public async addEntrepreneurCommunities(rows) {
    try {
      const user = await UserTable.findOne({
        email: "nataliezx2010@gmail.com",
      });
      const communities = [];
      let name = null,
        location = null;
      for (const row of rows) {
        name = row["Name"]?.trimEnd();
        location = row["Location"]?.trimEnd();
        if (name) {
          // Remove all special characters from name and location for googlePlaceId
          const sanitizedGooglePlaceId = `${name.replace(
            /[^a-zA-Z0-9]/g,
            ""
          )}${location.replace(/[^a-zA-Z0-9]/g, "")}`;

          communities.push({
            name: name,
            location: location,
            isNextChallengeScheduled: false,
            googlePlaceId: sanitizedGooglePlaceId,
            createdBy: user._id,
            type: 1,
            challenge: {
              type: CHALLENGE_TYPE[0],
              xpGoal: 0,
              endAt: null,
              reward: 0,
            },
          });
        }
      }
      return communities;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function add entrepreneur communities to DB
   * @param data
   * @returns {*}
   */
  public async addCommunitiesToDB(data: any) {
    let communities = [];
    try {
      data.forEach((obj) => {
        let bulkWriteObject = {
          updateOne: {
            filter: {
              name: obj.name,
              type: obj.type,
            },
            update: {
              $set: {
                name: obj.name,
                location: obj.location,
                isNextChallengeScheduled: obj.isNextChallengeScheduled,
                googlePlaceId: obj.googlePlaceId,
                createdBy: obj.createdBy,
                challenge: obj.challenge,
                type: obj.type,
              },
            },
            upsert: true,
          },
        };
        communities.push(bulkWriteObject);
      });
      await CommunityTable.bulkWrite(communities);
      return;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function remove the actions completed by the users from the daily-challenges collection
   * @returns {*}
   */
  public async removeCompletedActions() {
    try {
      const profilesToUpdate = await DailyChallengeTable.aggregate([
        {
          $lookup: {
            from: "business-profiles",
            localField: "userId",
            foreignField: "userId",
            as: "businessProfiles",
          },
        },
        {
          $project: {
            userId: 1,
            dailyGoalStatus: 1,
            idea: "$businessProfiles.idea",
            description: "$businessProfiles.description",
            completedActions: {
              $arrayElemAt: ["$businessProfiles.completedActions", 0],
            },
          },
        },
      ]).exec();
      const bulkOperations = profilesToUpdate
        ?.filter((profile) => profile?.completedActions)
        .map((profile) => {
          let completedActions = [...Object.keys(profile.completedActions)];
          if (profile.idea || profile.description) {
            completedActions = [
              "ideaValidation",
              ...Object.keys(profile.completedActions),
            ];
          }
          return {
            updateOne: {
              filter: { userId: profile.userId },
              update: {
                $pull: {
                  dailyGoalStatus: { key: { $in: completedActions } },
                },
              },
              upsert: false,
              timestamps: false,
            },
          };
        });
      if (bulkOperations.length > 0) {
        await DailyChallengeTable.bulkWrite(bulkOperations);
      }
      return profilesToUpdate;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function import the unexpected events content to DB
   * @returns {*}
   */
  public async convertEventsDataToJSON(rows) {
    try {
      const events = [];
      let eventId = null,
        scenario = null,
        scenarioImage = null,
        options = [],
        resultCopyInfo = [];
      for (const row of rows) {
        if (row["EventID"]?.trimEnd() && eventId != row["EventID"]?.trimEnd()) {
          if (options.length) {
            events.push({
              eventId,
              scenario,
              scenarioImage,
              options,
            });
          }
          eventId = row["EventID"]?.trimEnd();
          scenario = row["Scenario"]?.trimEnd();
          scenarioImage = row["ScenarioImage"]?.trimEnd() || null;
          options = [];
        }
        resultCopyInfo.push({
          description: row["Response1"]?.trimEnd() || null,
          image: row["ResponseImage1"]?.trimEnd() || null,
        });
        resultCopyInfo.push({
          description: row["Response2"]?.trimEnd() || null,
          image: row["ResponseImage2"]?.trimEnd() || null,
        });
        if (eventId) {
          options.push({
            choice: row["Choice"]?.trimEnd(),
            action: row["Action"]?.trimEnd() || null,
            resultCopyInfo,
            fans: Number(row["Fans"]?.trimEnd()) || 0,
            cash: Number(row["Cash"]?.trimEnd()) || 0,
            businessScore: Number(row["Business Score"]?.trimEnd()) || 0,
            tokens: Number(row["Token"]?.trimEnd()) || 0,
          });
          resultCopyInfo = [];
        }
      }
      return events;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function add Unexpected Events to DB
   * @param data
   * @returns {*}
   */
  public async addUnexpectedEventsToDB(data: any) {
    let events = [];
    try {
      data.forEach((obj) => {
        let bulkWriteObject = {
          updateOne: {
            filter: {
              eventId: obj.eventId,
            },
            update: {
              $set: {
                eventId: obj.eventId,
                scenario: obj.scenario,
                scenarioImage: obj.scenarioImage,
                options: obj.options,
              },
            },
            upsert: true,
          },
        };
        events.push(bulkWriteObject);
      });
      await MilestoneEventsTable.bulkWrite(events);
      return;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This function add Unexpected Events to DB
   * @param quizData
   * @param row
   * @returns {*}
   */
  public getResultCopyInfo(quizData: any, row: any) {
    try {
      let resultCopyInfo = {};
      if (quizData.quizType != 4 && row["PassImage1"]) {
        resultCopyInfo = {
          pass: {
            images: [
              {
                image: row["PassImage1"]?.trimEnd(),
                description: row["PassCopy1"]?.trimEnd(),
              },
              {
                image: row["PassImage2"]?.trimEnd(),
                description: row["PassCopy2"]?.trimEnd(),
              },
            ],
            resultSummary:
              quizData.quizType == 2
                ? SIMULATION_RESULT_COPY.pass.resultSummary
                : MILESTONE_RESULT_COPY.resultSummary,
          },
        };
      }
      if (
        quizData.quizType == 2 &&
        resultCopyInfo != null &&
        row["FailImage1"]
      ) {
        resultCopyInfo["fail"] = {
          images: [
            {
              image: row["FailImage1"]?.trimEnd(),
              description: row["FailCopy1"]?.trimEnd(),
            },
            {
              image: row["FailImage2"]?.trimEnd(),
              description: row["FailCopy2"]?.trimEnd(),
            },
          ],
          resultSummary: SIMULATION_RESULT_COPY.fail.resultSummary,
        };
      } else if (quizData.quizType == 4) {
        resultCopyInfo = null;
      }
      return resultCopyInfo;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}

export default new ScriptService();
