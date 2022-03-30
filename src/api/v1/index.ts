import Compose from "koa-compose";
import Router from "koa-router";

import { HttpMethod, IController } from "@app/types";
import {
  AliveController,
  PaypalController,
  StripeController,
  GiftCardController,
  DesignTemplateController,
  CircleController,
  WebhookController,
  AuthController,
  QuizController,
  VideoController,
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

setControllerRoutes(router, AliveController);
setControllerRoutes(router, PaypalController);
setControllerRoutes(router, StripeController);
setControllerRoutes(router, GiftCardController);
setControllerRoutes(router, DesignTemplateController);
setControllerRoutes(router, CircleController);
setControllerRoutes(router, WebhookController);
setControllerRoutes(router, AuthController);
setControllerRoutes(router, QuizController);
setControllerRoutes(router, VideoController);

export default Compose([router.routes(), router.allowedMethods()]);
