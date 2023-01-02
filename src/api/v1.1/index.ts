import Compose from "koa-compose";
import Router from "koa-router";

import { HttpMethod, IController } from "../../types/index";
import {
  AuthController,
  UserController,
  TradingController,
  QuizController
} from "./controllers";
const router = new Router();

const setControllerRoutes = (router: Router, controller: IController) => {
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
    let routeRegisterHandler: any = null;

    switch (x.method) {
      case HttpMethod.HEAD:
        routeRegisterHandler = router.head;
        break;
      case HttpMethod.OPTIONS:
        routeRegisterHandler = router.options;
        break;
      case HttpMethod.GET:
        routeRegisterHandler = router.get;
        break;
      case HttpMethod.PUT:
        routeRegisterHandler = router.put;
        break;
      case HttpMethod.PATCH:
        routeRegisterHandler = router.patch;
        break;
      case HttpMethod.POST:
        routeRegisterHandler = router.post;
        break;
      case HttpMethod.DELETE:
        routeRegisterHandler = router.delete;
        break;
    }

    if (routeRegisterHandler) {
      if (x.middleware) {
        if (Array.isArray(x.middleware)) {
          routeRegisterHandler.call(router, x.path, ...x.middleware, x.handler);
        } else {
          routeRegisterHandler.call(router, x.path, x.middleware, x.handler);
        }
      } else {
        routeRegisterHandler.call(router, x.path, x.handler);
      }
    }
  });
};
setControllerRoutes(router, AuthController);
setControllerRoutes(router, UserController);
setControllerRoutes(router, TradingController);
setControllerRoutes(router, QuizController);

export default Compose([router.routes(), router.allowedMethods()]);
