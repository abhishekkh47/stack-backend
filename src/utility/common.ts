import config from "../config";
import crypto from "crypto";
import { AdminTable, UserTable } from "../model";
import ShortUniqueId from "short-unique-id";

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

export const getQuizHours = async (headers) => {
  let admin = await AdminTable.findOne({});
  if (headers["buildversion"]) {
    let hours = admin.quizCooldown["default"];
    for (const [key, value] of Object.entries(admin.quizCooldown)) {
      if (key == headers["buildversion"]) {
        hours = value;
        break;
      }
    }
    return hours;
  }
  return admin.quizCooldown["default"];
};

export const getQuizImageAspectRatio = async (headers) => {
  let admin = await AdminTable.findOne({});
  if (headers["buildversion"]) {
    let aspectRatio = null;
    for (const [key, value] of Object.entries(admin.quizImageAspectRatio)) {
      if (key == headers["buildversion"]) {
        aspectRatio = value;
        break;
      }
    }
    return aspectRatio;
  }
  return null;
};
