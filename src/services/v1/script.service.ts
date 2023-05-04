import { ParentChildTable } from "@app/model/parentChild";
import axios from "axios";
import { ObjectId } from "mongodb";
import envData from "@app/config";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { QuizQuestionTable, QuizTable } from "@app/model";
import { NetworkError } from "@app/middleware";
import json2csv from "json2csv";
import fs from "fs";
import { Transform } from "stream";
import moment from "moment";
import path from "path";

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
        .catch((error) => {
          console.log(error);
        });
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
   * @returns {*}
   */
  public async readSpreadSheet() {
    const document = new GoogleSpreadsheet(envData.SHEET_ID);
    await document.useServiceAccountAuth({
      client_email: envData.CLIENT_EMAIL,
      private_key: envData.GOOGLE_SERVICEACCOUNT_PRIVATE_KEY,
    });
    await document.loadInfo();
    const sheet = document.sheetsByIndex[0];
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
        if (cell["_rawData"]["effectiveFormat"]["backgroundColor"].red !== 1) {
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
    rows: any
  ) {
    rows = rows.filter((x) => quizNums.includes(x["Quiz #"]));
    let lastQuizName = "";
    let lastQuizImage = "";
    let quizContentData = [];
    let questionDataArray = [];
    let order = 1;
    await Promise.all(
      await rows.map(async (data, index) => {
        if (data["Quiz Title"] != "") {
          lastQuizName = data["Quiz Title"];
          lastQuizImage = data["Quiz Image"];
        }
        if (data["Quiz Title"] == "") {
          ++order;
        } else {
          order = 1;
        }
        let questionData = {
          text: data["Question"],
          question_image: null,
          order: order,
          points: 10,
          question_type: 2,
          answer_type: 2,
          answer_array: [
            {
              name: data["A"],
              image: data["Image A"],
              correct_answer: data["correctAnswer"] == data["A"] ? 1 : 0,
              statement:
                data["correctAnswer"] == data["A"] ? data["Explanation"] : null,
            },
            {
              name: data["B"],
              image: data["Image B"],
              correct_answer: data["correctAnswer"] == data["B"] ? 1 : 0,
              statement:
                data["correctAnswer"] == data["B"] ? data["Explanation"] : null,
            },
            {
              name: data["C"],
              image: data["Image C"],
              correct_answer: data["correctAnswer"] == data["C"] ? 1 : 0,
              statement:
                data["correctAnswer"] == data["C"] ? data["Explanation"] : null,
            },
            {
              name: data["D"],
              image: data["Image D"],
              correct_answer: data["correctAnswer"] == data["D"] ? 1 : 0,
              statement:
                data["correctAnswer"] == data["D"] ? data["Explanation"] : null,
            },
          ],
        };
        questionDataArray.push(questionData);
        if (
          rows[index + 1] == undefined ||
          rows[index + 1]["Quiz #"] !== data["Quiz #"]
        ) {
          let quizData = {
            topicId: topicId,
            quizName: lastQuizName,
            image: lastQuizImage,
            questionData: questionDataArray,
          };
          quizContentData.push(quizData);
          questionDataArray = [];
        }
      })
    );
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
        quizContentData.map(async (data: any, index) => {
          const quiz = await QuizTable.create({
            quizName: data.quizName,
            topicId: data.topicId,
            image: data.image,
          });
          data.questionData = data.questionData.map((x) => ({
            ...x,
            quizId: quiz._id,
          }));
          quizQuestions = quizQuestions.concat(data.questionData);
        })
      );
      // /**
      //  * Create Quiz Question
      //  */
      const questions = await QuizQuestionTable.insertMany(quizQuestions);
      return true;
    } catch (err) {
      return false;
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
   */
  public async convertDataToCsv(ctx: any, parentChildRecords: any) {
    const fields = [
      "ParentName",
      "TeenName",
      "ParentNumber",
      "TeenNumber",
      "ParentCreationDate",
      "TeenCreationDate",
      "WhoComesFirst",
      "TimeBetweenCreation",
    ];
    const filePath = `uploads/${moment().unix()}.csv`;
    const csv = json2csv.parse(parentChildRecords, fields);
    const combinedStream = new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk);
      },
    });
    await new Promise((resolve, reject) => {
      combinedStream.pipe(fs.createWriteStream(filePath));
      combinedStream.write(csv);
      combinedStream.end();
      combinedStream.on("error", (err) => {
        reject(err);
      });
      combinedStream.on("finish", function () {
        console.log("file written");
        resolve(true);
      });
    });
    console.log("processing file");
    ctx.attachment(filePath);
    ctx.type = "text/csv";
    ctx.body = await fs.createReadStream(filePath);
    return ctx;
  }
}

export default new ScriptService();
