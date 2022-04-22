import Koa from "koa";

import { HttpMethod, IRouteParams } from "../types";

// Route decorator
export function Route(
  path: string | IRouteParams,
  method: HttpMethod = HttpMethod.GET,
  ...middleware: Koa.Middleware[]
) {
  return (target: any, key?: string | symbol, descriptor?: any): void => {
    if (!target.decoratorRoutes) {
      target.decoratorRoutes = [];
    }

    let order: number;

    if (typeof path === "object") {
      method = path.method || HttpMethod.GET;
      middleware = path.middleware
        ? Array.isArray(path.middleware)
          ? path.middleware
          : [path.middleware]
        : [];
      order = path.order;
      path = path.path;
    }

    target.decoratorRoutes.push({
      method,
      path,
      handler: descriptor.value.bind(target),
      middleware,
      order,
    });
  };
}
