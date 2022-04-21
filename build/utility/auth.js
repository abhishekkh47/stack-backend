"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefreshToken = exports.verifyToken = exports.getJwtToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getJwtToken = (body) => {
    var _a;
    return jsonwebtoken_1.default.sign(body, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "secret", {
        expiresIn: 36000,
    });
};
exports.getJwtToken = getJwtToken;
const verifyToken = (token) => {
    var _a;
    const response = jsonwebtoken_1.default.verify(token, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "secret");
    return response;
};
exports.verifyToken = verifyToken;
const getRefreshToken = (body) => {
    var _a;
    return jsonwebtoken_1.default.sign(body, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "secret", {
        expiresIn: "365d",
    });
};
exports.getRefreshToken = getRefreshToken;
//# sourceMappingURL=auth.js.map