import "module-alias/register";
import cors from "@koa/cors";
import http from "http";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Mount from "koa-mount";
import DotEnv from "dotenv";
import mongoose from "mongoose";
import path from 'path';

DotEnv.config();

import Config from "@app/config";
import { logger } from "@app/utility";
import { errorHandler, notFoundHandler } from "@app/middleware";
import ApiV1 from "@app/api/v1";
import { connectAgenda, startCron } from "@app/background";
// import i18n from "./i18n/i18n";
// import I18n from "@app/i18n/I18n";
import {I18n} from "i18n";
import i18n2 from "./i18n/en.json";

const i18nD = require("@app/i18n/i18n");
import i18n from "i18n";
// console.log(i18nSet, "i18nD");
// console.log("i18n2", i18n2);
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
    app.use(i18nD);
    app.use(bodyParser());

    // Handle exception
    app.use(errorHandler);
    // Mongodb
    await mongoose.connect(Config.DB_PATH);

    // Background
    await connectAgenda();
    startCron();

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
