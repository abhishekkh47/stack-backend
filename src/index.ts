import cors from "@koa/cors";
import http from "http";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Mount from "koa-mount";
import DotEnv from "dotenv";
import mongoose from "mongoose";

DotEnv.config();

import Config from "@app/config";
import { logger } from "@app/utility";
import { errorHandler, notFoundHandler } from "@app/middleware";
import ApiV1 from "@app/api/v1";
import { connectAgenda, startCron } from "@app/background";
import i18n from "../src/i18n/i18n";
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
    app.use(i18n);
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
