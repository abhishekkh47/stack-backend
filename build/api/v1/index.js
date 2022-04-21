"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_compose_1 = __importDefault(require("koa-compose"));
const koa_router_1 = __importDefault(require("koa-router"));
const types_1 = require("@app/types");
const controllers_1 = require("./controllers");
const router = new koa_router_1.default();
const setControllerRoutes = (router, controller) => {
    controller.routes.sort((a, b) => {
        const aOrder = a.order;
        const bOrder = b.order;
        if (aOrder && bOrder) {
            return aOrder - bOrder;
        }
        if (aOrder && !bOrder) {
            return -1;
        }
        if (!aOrder && bOrder) {
            return 1;
        }
        return 0;
    });
    controller.routes.forEach((x) => {
        let routeRegisterHandler = null;
        switch (x.method) {
            case types_1.HttpMethod.HEAD:
                routeRegisterHandler = router.head;
                break;
            case types_1.HttpMethod.OPTIONS:
                routeRegisterHandler = router.options;
                break;
            case types_1.HttpMethod.GET:
                routeRegisterHandler = router.get;
                break;
            case types_1.HttpMethod.PUT:
                routeRegisterHandler = router.put;
                break;
            case types_1.HttpMethod.PATCH:
                routeRegisterHandler = router.patch;
                break;
            case types_1.HttpMethod.POST:
                routeRegisterHandler = router.post;
                break;
            case types_1.HttpMethod.DELETE:
                routeRegisterHandler = router.delete;
                break;
        }
        if (routeRegisterHandler) {
            if (x.middleware) {
                if (Array.isArray(x.middleware)) {
                    routeRegisterHandler.call(router, x.path, ...x.middleware, x.handler);
                }
                else {
                    routeRegisterHandler.call(router, x.path, x.middleware, x.handler);
                }
            }
            else {
                routeRegisterHandler.call(router, x.path, x.handler);
            }
        }
    });
};
setControllerRoutes(router, controllers_1.AliveController);
setControllerRoutes(router, controllers_1.PaypalController);
setControllerRoutes(router, controllers_1.StripeController);
setControllerRoutes(router, controllers_1.GiftCardController);
setControllerRoutes(router, controllers_1.DesignTemplateController);
setControllerRoutes(router, controllers_1.CircleController);
setControllerRoutes(router, controllers_1.WebhookController);
setControllerRoutes(router, controllers_1.AuthController);
setControllerRoutes(router, controllers_1.QuizController);
setControllerRoutes(router, controllers_1.VideoController);
setControllerRoutes(router, controllers_1.HelpCenterController);
setControllerRoutes(router, controllers_1.TradingController);
setControllerRoutes(router, controllers_1.CryptoController);
setControllerRoutes(router, controllers_1.UserController);
setControllerRoutes(router, controllers_1.CMSController);
exports.default = (0, koa_compose_1.default)([router.routes(), router.allowedMethods()]);
//# sourceMappingURL=index.js.map