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
  StageTable,
  UserTable,
  WeeklyJourneyTable,
  WeeklyJourneyResultTable,
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
  PROMPT_STYLE,
  XP_POINTS,
  COMPLETED_ACTION_REWARD,
  IPromptData,
  checkQuizImageExists,
  IMAGE_GENERATION_PROMPTS,
  SYSTEM,
  USER,
} from "@app/utility";
import { everyCorrectAnswerPoints } from "@app/types";
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
          const stageIfExists = await StageTable.findOne({
            title: data.stageName,
          });
          const quiz = await QuizTable.findOneAndUpdate(
            { quizNum: quizNum },
            {
              $set: {
                quizName: data.quizName,
                topicId: data.topicId,
                image: data.image,
                tags: data.tags,
                stageId: stageIfExists?._id || null,
                quizType: data.quizType || QUIZ_TYPE.NORMAL,
                characterName: data.characterName || null,
                characterImage: data.characterImage || null,
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
      let quizQuery = [];
      for await (let data of quizCategoryData) {
        if (!data["Quiz #"] || !data["Category"]) {
          continue;
        }
        let quiz = await QuizTable.findOne({
          quizNum: parseInt(data["Quiz #"]),
        });
        if (!quiz) {
          continue;
        }
        let category = await QuizTopicTable.findOne({
          topic: data["Category"].trimEnd(),
        });
        if (!category) {
          category = await QuizTopicTable.create({
            type: 2,
            status: 1,
            hasStages: false,
            topic: data["Category"].trimEnd(),
          });
        }
        let bulkWriteObject = {
          updateMany: {
            filter: { quizId: quiz._id },
            update: {
              $set: { topicId: category ? category._id : quiz.topicId },
            },
          },
        };
        quizCategoryQuery.push(bulkWriteObject);
        let bulkWriteObjectQuiz = {
          updateMany: {
            filter: { _id: quiz._id },
            update: {
              $set: { topicId: category ? category._id : quiz.topicId },
            },
          },
        };
        quizQuery.push(bulkWriteObjectQuiz);
      }
      await QuizResult.bulkWrite(quizCategoryQuery);
      await QuizQuestionResult.bulkWrite(quizCategoryQuery);
      await QuizTable.bulkWrite(quizQuery);
      return { isAddedToDB: true, data: quizCategoryQuery };
    } catch (err) {
      return { isAddedToDB: false, data: null };
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
      await Promise.all(
        await rows.map(async (data, index) => {
          if (data["Simulation Title"] != "") {
            simulationTitle = data["Simulation Title"].trimEnd();
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
            points: 20,
            question_type: 2,
            answer_type: 2,
            answer_array: [
              {
                name: data["Option A"].trimEnd(),
                image: null,
                correct_answer:
                  data["correctAnswer"] == data["Response A"] ? 1 : 0,
                statement: data["Response A"],
              },
              {
                name: data["Option B"].trimEnd(),
                image: null,
                correct_answer:
                  data["correctAnswer"] == data["Response B"] ? 1 : 0,
                statement: data["Response B"],
              },
              {
                name: data["Option C"].trimEnd(),
                image: null,
                correct_answer:
                  data["correctAnswer"] == data["Response C"] ? 1 : 0,
                statement: data["Response C"],
              },
              {
                name: data["Option D"].trimEnd(),
                image: null,
                correct_answer:
                  data["correctAnswer"] == data["Response D"] ? 1 : 0,
                statement: data["Response D"],
              },
            ],
            correctStatement: data["Response if correct"],
            incorrectStatement: data["Response if incorrect"],
          };
          questionDataArray.push(questionData);
          if (
            rows[index + 1] == undefined ||
            rows[index + 1]["Simulation #"] !== data["Simulation #"]
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
                  key: data["Simulation #"],
                  value: lastQuizCategory,
                });
                topicId = null;
              } else {
                topicId = isCategoryExists._id;
              }
            }
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
  public async convertStorySpreadSheetToJSON(
    topicId: any,
    storyNums: any,
    rows: any,
    allTopics: any
  ) {
    const fallbackQuizTopic = new ObjectId("6594011ab1fc7ea1f458e8c8");
    try {
      const filteredStories = rows.filter((x) =>
        storyNums.includes(x["Story #"])
      );
      let storyTitle = "";
      let lastStoryCategory = "";
      let lastStoryStage = "";
      let order = 1;
      let descriptionNum = 0;
      let characterName = "";
      let characterImage = "";
      let categories = [];
      let storyContentData = [];
      let questionDataArray = [];
      let filterCategory = [];
      let questionData = null;
      let currentPromptStyle = null;
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
        filteredStories.map(async (data) => {
          const storyNumber = Number(data["Story #"]);
          if (!(storyNumber in promptList)) {
            promptList[storyNumber] = {
              descriptions: [],
              questions: [],
            };
          }
          currentPromptStyle =
            PROMPT_STYLE[Number(data["Prompt Style"]?.trimEnd()) - 1] ||
            currentPromptStyle;
          if (data["Prompt Type"]?.trimEnd() == "Description") {
            const storyImageName = data["Story Image"];
            const desc: IPromptData = {
              promptDescription: data["Text"]?.trimEnd(),
              promptStyle: currentPromptStyle,
              imageName: `s${storyNumber}_d${
                promptList[storyNumber].descriptions.length + 1
              }`,
            };
            if (storyImageName) {
              desc.isNameOverride = true;
              desc.imageName = storyImageName;
            }
            promptList[storyNumber].descriptions.push(desc);
          } else {
            const prompts = ["A", "B", "C", "D"];
            const promptData: IPromptData[] = prompts.map((promptKey) => {
              const questionImageName = data[`Image ${promptKey}`];
              const question: IPromptData = {
                promptDescription: data[promptKey]?.trimEnd(),
                promptStyle: currentPromptStyle,
                imageName: `s${storyNumber}_q${Math.ceil(
                  promptList[storyNumber].questions.length / 4 + 1
                )}_${`Prompt ${promptKey}`.slice(-1).toLocaleLowerCase()}`,
              };
              if (questionImageName) {
                question.isNameOverride = true;
                question.imageName = questionImageName;
              }
              return question;
            });
            promptList[storyNumber].questions.push(...promptData);
          }
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

      const { descriptionPrompts, questionPrompts } = await this.generatePrompt(
        descriptions,
        questions
      );
      this.generateImages(descriptionPrompts, questionPrompts, outputPath);

      // ---------- TEXT CONTENT ----------- \\

      await Promise.all(
        await filteredStories.map(async (data, index) => {
          if (data["Story Title"] == "") {
            ++order;
          } else {
            storyTitle = data["Story Title"]?.trimEnd();
            order = 1;
          }
          lastStoryCategory = !!data["Category"]
            ? data["Category"]?.trimEnd()
            : "";
          lastStoryStage = !!data["Stage"] ? data["Stage"]?.trimEnd() : "";
          if (!data["Character"]) characterName = null;
          if (!data["Character Image"]) characterImage = null;

          const baseQuestionData = {
            text: data["Text"]?.trimEnd(),
            order: order,
          };
          if (data["Prompt Type"]?.trimEnd() == "Description") {
            descriptionNum++;
            const questionImageName = data["Story Image"];
            questionData = {
              ...baseQuestionData,
              question_image:
                questionImageName ||
                `s${data["Story #"]}_d${descriptionNum}.png`,
              points: 0,
              question_type: 4,
              answer_type: null,
              answer_array: null,
              correctStatement: null,
              incorrectStatement: null,
            };
          } else {
            const prompts = ["A", "B", "C", "D"];
            questionData = {
              ...baseQuestionData,
              question_image: null,
              points: 10,
              question_type: 2,
              answer_type: 2,
              answer_array: prompts.map((prompt) => ({
                name: data[prompt]?.trimEnd(),
                image:
                  data[`Image ${prompt}`] ||
                  `s${data["Story #"]}_q${
                    (index + 1) / 4
                  }_${prompt.toLowerCase()}.png`,
                correct_answer: data["correctAnswer"] == data[prompt] ? 1 : 0,
                statement: null,
              })),
              correctStatement: data["Explanation"],
              incorrectStatement: data["Explanation"],
            };
          }
          questionDataArray.push(questionData);
          if (
            rows[index + 1] == undefined ||
            rows[index + 1]["Story #"] !== data["Story #"]
          ) {
            if (lastStoryCategory) {
              const isCategoryExists = allTopics.find(
                (x) => x.topic == lastStoryCategory
              );
              /**
               * We found a category in the spreadsheet for this story #.
               * But does this category already exist in DB? If no, create it.
               */
              if (!isCategoryExists) {
                categories.push({
                  topic: lastStoryCategory,
                  image: null,
                  status: 1,
                  type: 3,
                });
                filterCategory.push({
                  key: data["Story #"],
                  value: lastStoryCategory,
                });
                topicId = fallbackQuizTopic;
              } else {
                topicId = isCategoryExists._id;
              }
            }
            let quizData = {
              topicId: topicId,
              quizNum: data["Story #"].trimEnd(),
              quizName: storyTitle,
              image: null,
              quizType: QUIZ_TYPE.STORY,
              stageName: lastStoryStage,
              characterName: characterName,
              characterImage: characterImage,
              tags: null,
              questionData: questionDataArray,
            };
            storyContentData.push(quizData);
            questionDataArray = [];
          }
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
  public async processWeeklyChallenges(rows: any) {
    let weeklyChallenges = [];

    try {
      let currentWeek = null;
      let currentDay = null;
      let currentWeekIndex = -1;
      let title = null;
      for (let data of rows) {
        let weekNum = parseInt(data["Week #"]?.trimEnd());
        title = data["Title"]?.trimEnd() ? data["Title"]?.trimEnd() : title;
        let dayNum = parseInt(data["Day #"]?.trimEnd());
        let dailyGoal = data["DailyGoal"]?.trimEnd()
          ? data["DailyGoal"]?.trimEnd()
          : null;
        let type = null;
        let currentReward = null;
        let currentQuizId = null;

        if (weekNum !== currentWeek || (dayNum && dayNum !== currentDay)) {
          currentWeek = weekNum;
          currentDay = dayNum;
          currentWeekIndex++;
          weeklyChallenges.push({
            week: weekNum,
            title: title,
            day: dayNum,
            dailyGoal: dailyGoal,
            actions: [],
            rewardType: null,
            reward: null,
          });
        }

        if (data["Type"]?.trimEnd() == "action") {
          type = 4;
          currentReward = COMPLETED_ACTION_REWARD;
        } else {
          const quizNum = data["QuizNum"]?.trimEnd();
          const quizId = await QuizTable.find({
            quizNum,
          }).select("quizId");
          const quizCount = await QuizQuestionTable.countDocuments({
            quizId: quizId[0],
          });
          currentQuizId = quizId[0]._id;

          if (data["Type"] == "simulation") {
            type = 2;
            currentReward = XP_POINTS.SIMULATION_QUIZ;
          } else if (data["Type"] == "story") {
            type = 3;
            currentReward = (quizCount / 4) * everyCorrectAnswerPoints;
          } else {
            type = 1;
            currentReward = quizCount * everyCorrectAnswerPoints;
          }
        }

        const action = {
          actionNum: parseInt(data["Action #"]?.trimEnd()),
          type: type,
          quizNum: parseInt(data["QuizNum"]?.trimEnd()) || null,
          quizId: currentQuizId || null,
          taskName: data["TaskName"]?.trimEnd() || null,
          tip: data["Tip"]?.trimEnd() || null,
          key: data["Key"]?.trimEnd() || null,
          actionInput: data["ActionInput"]?.trimEnd() || null,
          reward: currentReward,
        };
        weeklyChallenges[currentWeekIndex].actions.push(action);
      }
    } catch (error) {
      throw new NetworkError("Something Went Wrong", 400);
    }
    return weeklyChallenges;
  }

  /**
   * @description This function is add simulations into db
   * @param dailyChallenges
   */
  public async addweeklyDataToDB(dailyChallenges: any) {
    try {
      let dailyChallengesData = [];
      dailyChallenges.map(async (data: any) => {
        const weekNum = isNaN(parseInt(data.week)) ? null : parseInt(data.week);
        const dayNum = isNaN(parseInt(data.week)) ? null : parseInt(data.day);
        if (!weekNum || !dayNum) return false;

        let bulkWriteObject = {
          updateOne: {
            filter: { week: data.week, day: data.day },
            update: {
              $set: {
                ...data,
                week: data.week,
                day: data.day,
              },
            },
            upsert: true,
          },
        };
        dailyChallengesData.push(bulkWriteObject);
      });

      const weeklyChallenges = await WeeklyJourneyTable.bulkWrite(
        dailyChallengesData
      );
      return true;
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
        return `${promptData.imageName}.png`;
      }
      const isImageAlreadyExist: boolean = await checkQuizImageExists(
        promptData
      );
      if (isImageAlreadyExist) {
        console.log(
          `${promptData.imageName} already exists in s3 bucket. Skipping.`
        );
        return `${promptData.imageName}.png`;
      }
      const imagineRes = await generateImage(
        `${promptData.prompt} ${promptData.promptStyle}`
      );
      if (!imagineRes) {
        throw new NetworkError("Something Went Wrong in imagineRes", 400);
      }
      const myImage = await UpscaleImage(imagineRes);
      if (!myImage) {
        throw new NetworkError("Something Went Wrong in myImage", 400);
      }
      if (myImage) {
        const outputPath = path.join(
          __dirname,
          `/midJourneyImages/${promptData.imageName}.png`
        );
        await downloadImage(myImage.uri, outputPath)
          .then(() => {
            console.log(`Image downloaded to ${outputPath}`);
          })
          .catch(console.error);
        if (questionType == STORY_QUESTION_TYPE.DESCRIPTION) {
          sharp(outputPath)
            .resize({ fit: "inside", width: 390, height: 518 })
            .png({ quality: 40 });
        } else {
          sharp(outputPath)
            .resize({ fit: "inside", width: 160, height: 160 })
            .png({ quality: 40 });
        }
        uploadQuizImages(promptData, outputPath);
      }
      return `${promptData.imageName}.png`;
    } catch (error) {
      if (error.message.indexOf("Job with id") >= 0) {
        console.log(
          `Error occurred while generating ${promptData.imageName}.png, trying again`
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
  public async convertWeeklyQuizSpreadSheetToJSON(quizNums: any, rows: any) {
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
              imageName: `q${quizNumber}_q${Math.ceil(
                promptList[quizNumber].questions.length / 4 + 1
              )}_${`Prompt ${promptKey}`.slice(-1).toLocaleLowerCase()}`,
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
            points: 10,
            question_type: 2,
            answer_type: 2,
            answer_array: prompts.map((prompt) => ({
              name: data[prompt]?.trimEnd(),
              image:
                data[`Image ${prompt}`] ||
                `q${
                  data["Quiz #"]
                }_q${questionNumber}_${prompt.toLowerCase()}.png`,
              correct_answer: data["correctAnswer"] == data[prompt] ? 1 : 0,
              statement:
                data["correctAnswer"] == data[prompt]
                  ? data["Explanation"].trimEnd()
                  : null,
            })),
          };
          questionDataArray.push(questionData);
          if (
            rows[index + 1] == undefined ||
            rows[index + 1]["Quiz #"] !== data["Quiz #"]
          ) {
            let quizData = {
              topicId: new ObjectId("6594011ab1fc7ea1f458e8c8"),
              quizNum: data["Quiz #"].trimEnd(),
              quizName: lastQuizName,
              image: null,
              stageName: lastQuizStage,
              tags: lastQuizTags,
              questionData: questionDataArray,
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
            (question) => Object.keys(question).length > 0
          )
        );
      });
      const { questionPrompts } = await this.generatePrompt([], questions);
      this.generateImages([], questionPrompts, outputPath);
      return quizContentData;
    } catch (error) {
      console.log("ERROR : ", error.message);
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
}

export default new ScriptService();
