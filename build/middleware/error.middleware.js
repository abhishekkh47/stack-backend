"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const utility_1 = require("@app/utility");
const multer_1 = __importDefault(require("multer"));
const errorHandler = async (ctx, next) => {
    try {
        await next();
    }
    catch (e) {
        let message = e.status === 500 ? "Internal server error" : e.message || "Unknown";
        const status = e.status || 500;
        const messages = e.messages || [];
        if (status === 500) {
            utility_1.logger.error("error", e);
        }
        if (e instanceof multer_1.default.MulterError) {
            switch (e.code) {
                case "LIMIT_UNEXPECTED_FILE":
                    message =
                        "You have added unexpected file.Please check it respectively";
                    break;
                case "LIMIT_FILE_SIZE":
                    message =
                        "You have added file size of more than what was expected. Please check carefully.";
                    break;
                default:
                    message = "Internal server error";
                    break;
            }
        }
        ctx.status = status;
        ctx.body = {
            status: status,
            code: status,
            message,
            messages,
            path: ctx.path,
        };
    }
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map