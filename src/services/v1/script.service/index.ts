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
  XP_POINTS,
  IPromptData,
  checkQuizImageExists,
  IMAGE_GENERATION_PROMPTS,
  SYSTEM,
  USER,
  IMPORT_SCRIPT,
  ICharacterImageData,
  delay,
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
                startupExecutive: data.startupExecutive,
                company: data.company,
                brandColors: data.brandColors,
                fullStoryText: data.fullStoryText,
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
                name: data["Option A"].trimEnd().split("*")[0],
                image: null,
                correct_answer:
                  data["correctAnswer"] == data["Response A"] ? 1 : 0,
                statement: data["Response A"],
              },
              {
                name: data["Option B"].trimEnd().split("*")[0],
                image: null,
                correct_answer:
                  data["correctAnswer"] == data["Response B"] ? 1 : 0,
                statement: data["Response B"],
              },
              {
                name: data["Option C"].trimEnd().split("*")[0],
                image: null,
                correct_answer:
                  data["correctAnswer"] == data["Response C"] ? 1 : 0,
                statement: data["Response C"],
              },
              {
                name: data["Option D"].trimEnd().split("*")[0],
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
      let characterName = "";
      let characterImage = "";
      let storyContentData = [];
      let questionDataArray = [];
      let questionData = null;
      let currentStoryNumber = 0;
      let questionNum = 0;
      let startupExecutive = "";
      let company = "";
      let brandColors = "";
      let pronouns = [];
      let fullStoryText = "";
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
          let imageNamesData = rowData[`Image Names ${storyNumber}`];
          if (currentStoryNumber != storyNumber) {
            currentStoryNumber = storyNumber;
            descriptionNum = 0;
            questionNum = 0;
            characterName = `${data["First Name"]?.trimEnd()} ${data[
              "Last Name"
            ]?.trimEnd()}`;
            characterImage = data["Discord Image Link"]?.trimEnd();
            startupExecutive = data["Startup Executive"]?.trimEnd();
            company = data["Company"]?.trimEnd();
            brandColors = data["Brand Colors"]?.trimEnd();
            fullStoryText = data["Full Story Text"]?.trimEnd();
            pronouns = [
              data["Pronoun 1"]?.trimEnd(),
              data["Pronoun 2"]?.trimEnd(),
            ];
            storyTitle = data["Title"]?.trimEnd();
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
              points: 10,
              question_type: 2,
              answer_type: 2,
              answer_array: prompts.map((prompt) => ({
                name:
                  data[`Q${question} A${prompt}`]?.trimEnd().split("*").length >
                  1
                    ? data[`Q${question} A${prompt}`]?.trimEnd().split("*")[0]
                    : data[`Q${question} A${prompt}`]?.trimEnd(),
                image:
                  imageNamesData[`Q${question} A${prompt}`]?.trimEnd() ||
                  `s${storyNumber}_q${1}_a${prompt.toLowerCase()}.webp`,
                correct_answer:
                  data[`Q${question} A${prompt}`]?.trimEnd().split("*").length >
                  1
                    ? 1
                    : 0,
                statement: null,
              })),
              correctStatement: data[`Q${question} Explanation`]?.trimEnd(),
              incorrectStatement: data[`Q${question} Explanation`]?.trimEnd(),
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
            characterName: characterName,
            characterImage: characterImage,
            tags: null,
            startupExecutive,
            company,
            brandColors,
            fullStoryText,
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
            currentReward = XP_POINTS.SIMULATION_QUIZ;
          } else if (data["Type"] == "story") {
            type = 3;
            currentReward = 4 * everyCorrectAnswerPoints;
          } else {
            const quizCount = await QuizQuestionTable.countDocuments({
              quizId: quizId,
            });
            type = 1;
            currentReward = quizCount * everyCorrectAnswerPoints || 0;
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
            points: 10,
            question_type: 2,
            answer_type: 2,
            answer_array: prompts.map((prompt) => ({
              name: data[prompt]?.trimEnd().split("*")[0],
              image:
                data[`Image ${prompt}`] ||
                `q${data["Quiz #"]}_q${Math.ceil(
                  questionNumber / 4
                )}_${prompt.toLowerCase()}.webp`,
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
}

export default new ScriptService();
