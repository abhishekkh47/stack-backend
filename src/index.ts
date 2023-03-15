import cors from "@koa/cors";
import http from "http";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Mount from "koa-mount";
import DotEnv from "dotenv";
import mongoose from "mongoose";
import monitor from "koa-monitor";
DotEnv.config();

import Config from "./config";
import { logger } from "./utility";
import { errorHandler, notFoundHandler } from "./middleware";
import Api from "./controllers";
import i18nTs from "./i18n/i18n";
import en from "./i18n/en.json";
import views from "koa-views";
import { startCron } from "./background";
import { AnalyticsService } from "./services/v1";

const server = (async () => {
  try {
    const app = new Koa();
    const appServer = http.createServer(app.callback());
    app.use(monitor(appServer, { path: "/status" }));

    const render = views(__dirname + "/views", { extension: "pug" });

    app.use(render);
    // Enable cors
    app.use(cors());
    app.use(i18nTs);
    app.use(async (ctx, next) => {
      console.log(ctx.path, "path");
      if (
        [
          "/update-primetrust-data",
          "/api/v2/upload-id-proof",
          "/api/v1/upload-id-proof",
        ].filter((item) => ctx.path.includes(item)).length > 0
      ) {
        ctx.disableBodyParser = true;
      }
      await next();
    });
    // app.use(bodyparser());
    app.use(
      bodyParser({
        jsonLimit: "50mb",
      })
    );

    // Handle exception
    app.use(errorHandler);
    // Mongodb
    await mongoose.connect(Config.DB_PATH);

    //Background
    startCron();

    AnalyticsService.init();

    app.use(Mount("/api", Api));

    // Request url not found
    app.use(notFoundHandler);

    const port = Config.PORT;

    appServer.listen(port);

    logger.log("info", `Server running on port ${port}`);
  } catch (e) {
    logger.log("error", `Server startup failed: ${e.message}`);
  }

  process.on("uncaughtException", function (error: any) {
    console.log(error, "uncaught exception");
  });
})();

export default server;
