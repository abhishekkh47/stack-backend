import config from "@app/config";
import crypto from "crypto";
import { AdminTable, UserTable } from "@app/model";
import ShortUniqueId from "short-unique-id";
import { DEFAULT_TIMEZONE, QUIZ_CATEGORIES_COLORS } from "./constants";
import aws from "aws-sdk";
const stepFunctions = new aws.StepFunctions({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "us-east-1",
});

const getUid = new ShortUniqueId({ length: 7 });

export const generateHash = (value: string) => {
  return crypto.createHash("md5").update(value).digest("hex");
};

export const getSharableLink = (hash: string) => {
  return `${config.WEB_URL}/receiver-email/${hash}`;
};

export const getReactivateLink = (hash: string) => {
  return `${config.WEB_URL}/reactivate/${hash}`;
};

export const generateRandom6DigitCode = (isLive) => {
  return isLive ? Math.floor(100000 + Math.random() * 900000) : 123456;
};

export const get72HoursAhead = (DateTime: any) => {
  const diff = new Date().valueOf() - new Date(DateTime).valueOf();
  return diff / 1000 / 60 / 60;
};

export const getMinutesBetweenDates = (startDate, endDate) => {
  const diff = endDate.getTime() - startDate.getTime();
  return diff / 60000;
};

/**
 * @description This function use for create validation unique key
 * @param apiTag
 * @param error
 * @returns {*}
 */
export const validationMessageKey = (apiTag: string, error: any) => {
  let key = toUpperCase(error.details[0].context.key);
  let type = error.details[0].type.split(".");
  type = toUpperCase(type[1]);
  key = apiTag + key + type;
  return key;
};

const toUpperCase = (str) => {
  if (str.length > 0) {
    const newStr = str
      .toLowerCase()
      .replace(/_([a-z])/, (m) => m.toUpperCase())
      .replace(/_/, "");
    return str.charAt(0).toUpperCase() + newStr.slice(1);
  }
  return "";
};
export const checkValidImageExtension = (file) => {
  let fileArray = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (file.fieldname === "profile_picture")
    fileArray = ["image/jpeg", "image/jpg", "image/png"];
  if (file && fileArray.includes(file.mimetype)) return true;
  return false;
};

export const checkValidBase64String = (text) => {
  let match = text.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!match || match.length !== 3) {
    return false;
  }
  return true;
};

export const makeUniqueReferalCode = async () => {
  let flag = true;
  let result = "";
  do {
    result = getUid();
    let findQuery = { referralCode: result };
    const checkReferralCodeExists = await UserTable.findOne(findQuery);
    if (!checkReferralCodeExists) {
      flag = false;
    } else {
      result = "";
    }
  } while (flag);
  return result;
};

export const getQuizCooldown = async (headers) => {
  let admin = await AdminTable.findOne({});
  let hours = admin.quizCooldown["default"];
  let quizCoolDownHours = Object.values(admin.quizCooldown).pop();
  if (!headers["build-version"]) {
    return hours;
  }
  let key = Object.keys(admin.quizCooldown).find((x) => {
    if (x == headers["build-version"]) {
      return x;
    }
  });
  return admin.quizCooldown[key] ? admin.quizCooldown[key] : quizCoolDownHours;
};

export const getQuizImageAspectRatio = async (headers) => {
  let admin = await AdminTable.findOne({});
  let aspectRatio = Object.values(admin.quizImageAspectRatio).pop();
  if (!headers["build-version"]) {
    return aspectRatio;
  }
  let key = Object.keys(admin.quizImageAspectRatio).find((x) => {
    if (x == headers["build-version"]) {
      return x;
    }
  });
  if (!admin.quizImageAspectRatio[key]) {
    return aspectRatio;
  }
  return admin.quizImageAspectRatio[key];
};

export const convertDateToTimeZone = (
  date: any,
  tzString: string = DEFAULT_TIMEZONE
) => {
  const dateObject = new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
      timeZone: tzString,
    })
  );
  const day = dateObject.getDate();
  const month = dateObject.getMonth() + 1;
  const year = dateObject.getFullYear();
  return {
    day,
    month,
    year,
    date: formattedDate(year, month, day),
  };
};

export const formattedDate = (year, month, day) => {
  const date = [
    year,
    month.toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("-");
  return date;
};

export const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

export const daysInMonth = (year, month) => {
  const days = [
    31,
    28 + (isLeapYear(year) ? 1 : 0),
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return days[month - 1];
};

export const getDaysBetweenDates = (startDate, endDate) => {
  const days1 =
    Array.from({ length: startDate.month - 1 }, (_, month) =>
      daysInMonth(startDate.year, month + 1)
    ).reduce((acc, val) => acc + val, startDate.day) +
    startDate.year * 365;
  const days2 =
    Array.from({ length: endDate.month - 1 }, (_, month) =>
      daysInMonth(endDate.year, month + 1)
    ).reduce((acc, val) => acc + val, endDate.day) +
    endDate.year * 365;

  const diffDays = Math.abs(days2 - days1);
  return diffDays;
};

export const getQuizBackgroundColor = (indexNumber) => {
  const colorIndex = indexNumber % QUIZ_CATEGORIES_COLORS.length;
  return QUIZ_CATEGORIES_COLORS[colorIndex];
};

export const executeWeeklyChallengeStepFunction = (
  message: string,
  communityId: string,
  timestamp: string
) => {
  const executionInput = {
    timestamp,
    communityId,
    message,
  };
  const executionParams = {
    stateMachineArn: config.WEEKLY_CHALLENGE_STATE_MACHINE_ARN,
    input: JSON.stringify(executionInput),
  };
  const isMessageSent = stepFunctions.startExecution(
    executionParams,
    (err, data) => {
      if (err) {
        console.error("Error starting execution:", err);
        return false;
      } else {
        console.log("Execution started:", data.executionArn);
        return true;
      }
    }
  );
  return isMessageSent;
};

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
