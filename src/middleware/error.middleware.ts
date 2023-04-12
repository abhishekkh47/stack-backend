import * as Koa from "koa";

import { logger } from "@app/utility";
import multer from "multer";

export const errorHandler = async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next();
  } catch (e) {
    let message =
      e.status === 500 ? "Internal server error" : e.message || "Unknown";
    const status = e.status || 500;
    const messages = e.messages || [];

    if (status === 500) {
      logger.error("error", e);
    }

    if (e instanceof multer.MulterError) {
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
    return ctx;
  }
};

export class NetworkError extends Error {
  status: number;
  constructor(message: any, status: number) {
    super(message);
    this.status = status;
  }
}
