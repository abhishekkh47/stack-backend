import cors from "@koa/cors";
import http from "http";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Mount from "koa-mount";
import DotEnv from "dotenv";
import mongoose from "mongoose";

DotEnv.config();

import Config from "./config";
import { logger } from "./utility";
import { errorHandler, notFoundHandler } from "./middleware";
import ApiV1 from "./api/v1";
import i18nTs from "./i18n/i18n";
import en from "./i18n/en.json";
import views from "koa-views";
const koaBody = require("koa-body");
const server = (async () => {
  try {
    const app = new Koa();
    const render = views(__dirname + "/views", { extension: "pug" });

    app.use(render);
    // Enable cors
    app.use(cors());

    const appServer = http.createServer(app.callback());
    app.use(i18nTs);
    app.use(bodyParser());

    // Handle exception
    app.use(errorHandler);
    // Mongodb
    await mongoose.connect(Config.DB_PATH);

    app.use(Mount("/api/v1", ApiV1));

    // Request url not found
    app.use(notFoundHandler);

    const port = Config.PORT;

    appServer.listen(port);
    logger.log("info", `Server running on port ${port}`);
  } catch (e) {
    logger.log("error", `Server startup failed: ${e.message}`);
  }
})();

export default server;
