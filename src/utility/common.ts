import config from "@app/config";
import crypto from "crypto";
import { AdminTable, UserTable } from "@app/model";
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

export const getQuizCooldown = async (headers) => {
  let admin = await AdminTable.findOne({});
  let hours = admin.quizCooldown["default"];
  if (!headers["build-version"]) {
    return hours;
  }
  let key = Object.keys(admin.quizCooldown).find((x) => {
    if (x == headers["build-version"]) {
      return x;
    }
  });
  return admin.quizCooldown[key] ? admin.quizCooldown[key] : hours;
};

export const getQuizImageAspectRatio = async (headers) => {
  let admin = await AdminTable.findOne({});
  if (!headers["build-version"]) {
    return null;
  }
  let key = Object.keys(admin.quizImageAspectRatio).find((x) => {
    if (x == headers["build-version"]) {
      return x;
    }
  });
  return admin.quizImageAspectRatio[key];
};
