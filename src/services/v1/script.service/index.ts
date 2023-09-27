import { ParentChildTable } from "@app/model/parentChild";
import axios from "axios";
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
} from "@app/model";
import { NetworkError } from "@app/middleware";
import json2csv from "json2csv";
import fs from "fs";
import { Transform } from "stream";
import moment from "moment";

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
  public async readSpreadSheet(gid: string = null) {
    const document = new GoogleSpreadsheet(envData.SHEET_ID);
    await document.useServiceAccountAuth({
      client_email: envData.CLIENT_EMAIL,
      private_key: envData.GOOGLE_SERVICEACCOUNT_PRIVATE_KEY,
    });
    await document.loadInfo();
    const sheet = gid ? document.sheetsById[gid] : document.sheetsByIndex[0];
    await sheet.loadCells();
    let rows = await sheet.getRows();
    if (gid) return rows;
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
          console.log(parseInt(data["Quiz #"]));
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
  public async storeSimulationsIntoDB(
    rows: any,
    simulationNums: any,
    topic: any,
    stages: any
  ) {
    try {
      rows = rows.filter((x) => simulationNums.includes(x["Simulation #"]));
      let simulationTitle = "";
      let simulationImage = "";
      let topicId = "";
      let stageId = "";
      let characterName = "";
      let characterImage = "";
      let simulationDataArray = [];
      await Promise.all(await rows.map(async (data, index) => {}));
    } catch (error) {
      throw new NetworkError("Something Went Wrong", 400);
    }
  }
}

export default new ScriptService();
