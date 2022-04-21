"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const cors_1 = __importDefault(require("@koa/cors"));
const http_1 = __importDefault(require("http"));
const koa_1 = __importDefault(require("koa"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const koa_mount_1 = __importDefault(require("koa-mount"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const config_1 = __importDefault(require("@app/config"));
const utility_1 = require("@app/utility");
const middleware_1 = require("@app/middleware");
const v1_1 = __importDefault(require("@app/api/v1"));
const background_1 = require("@app/background");
const i18nD = require("./i18n/i18n");
const koa_views_1 = __importDefault(require("koa-views"));
const koaBody = require("koa-body");
const server = (async () => {
    try {
        const app = new koa_1.default();
        const render = (0, koa_views_1.default)(__dirname + "/views", { extension: "pug" });
        app.use(render);
        app.use((0, cors_1.default)());
        const appServer = http_1.default.createServer(app.callback());
        app.use(i18nD);
        app.use((0, koa_bodyparser_1.default)());
        app.use(middleware_1.errorHandler);
        await mongoose_1.default.connect(config_1.default.DB_PATH);
        await (0, background_1.connectAgenda)();
        (0, background_1.startCron)();
        app.use((0, koa_mount_1.default)("/api/v1", v1_1.default));
        app.use(middleware_1.notFoundHandler);
        const port = config_1.default.PORT;
        appServer.listen(port);
        utility_1.logger.log("info", `Server running on port ${port}`);
    }
    catch (e) {
        utility_1.logger.log("error", `Server startup failed: ${e.message}`);
    }
})();
exports.default = server;
//# sourceMappingURL=index.js.map