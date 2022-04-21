"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkValidImageExtension = exports.hashString = exports.toUpperCase = exports.validationMessageKey = exports.getMinutesBetweenDates = exports.get72HoursAhead = exports.generateTempPassword = exports.generateRandom6DigitCode = exports.getReactivateLink = exports.getSharableLink = exports.generateHash = void 0;
const config_1 = __importDefault(require("@app/config"));
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const generateHash = (value) => {
    return crypto_1.default.createHash("md5").update(value).digest("hex");
};
exports.generateHash = generateHash;
const getSharableLink = (hash) => {
    return `${config_1.default.WEB_URL}/receiver-email/${hash}`;
};
exports.getSharableLink = getSharableLink;
const getReactivateLink = (hash) => {
    return `${config_1.default.WEB_URL}/reactivate/${hash}`;
};
exports.getReactivateLink = getReactivateLink;
const generateRandom6DigitCode = (isLive) => {
    return isLive ? Math.floor(100000 + Math.random() * 900000) : 123456;
};
exports.generateRandom6DigitCode = generateRandom6DigitCode;
const generateTempPassword = (username) => {
    return `STACK_${username}_${(Math.random() + 1).toString(36).substring(7)}`;
};
exports.generateTempPassword = generateTempPassword;
const get72HoursAhead = (DateTime) => {
    const diff = new Date().valueOf() - new Date(DateTime).valueOf();
    return diff / 1000 / 60 / 60;
};
exports.get72HoursAhead = get72HoursAhead;
const getMinutesBetweenDates = (startDate, endDate) => {
    const diff = endDate.getTime() - startDate.getTime();
    return diff / 60000;
};
exports.getMinutesBetweenDates = getMinutesBetweenDates;
const validationMessageKey = (apiTag, error) => {
    let key = (0, exports.toUpperCase)(error.details[0].context.key);
    let type = error.details[0].type.split(".");
    type = (0, exports.toUpperCase)(type[1]);
    key = apiTag + key + type;
    return key;
};
exports.validationMessageKey = validationMessageKey;
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
exports.toUpperCase = toUpperCase;
const hashString = (length = 10) => {
    let result = "";
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i += 1) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    result += bcrypt_1.default.hashSync(result, 10);
    return result;
};
exports.hashString = hashString;
const checkValidImageExtension = (file) => {
    if (file &&
        ["image/jpeg", "image/jpg", "application/pdf"].includes(file.mimetype)) {
        return true;
    }
    return false;
};
exports.checkValidImageExtension = checkValidImageExtension;
//# sourceMappingURL=common.js.map