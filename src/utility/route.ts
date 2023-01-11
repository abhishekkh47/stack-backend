import Koa from "koa";
import { HttpMethod, IController, IControllerRoute, IRouteParams } from "../types";

export interface IRouteDict {
  // key will look like this: httpMethod + ' - ' + routePath
  [key: string]: IControllerRoute & { version: string; };
}

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

// Get the route dictionary for the given version.
// This will be merged into a bigger dict for use in koa-api-version integration
export const getRouteDict = (version: string, controllers: IController[]): IRouteDict => {
  const dict = {};
  const routes: IControllerRoute[] = [].concat.apply([], controllers.map(controller => controller.routes))
  routes.forEach((x) => {
    dict[x.method + ' - ' + x.path] = { ...x, version };
  });
  return dict;
};
