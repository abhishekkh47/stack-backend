import Compose from "koa-compose";
import Router from "koa-router";
const KoaRouterVersion = require("koa-router-version");

import { IRouteDict } from "../utility";
import routerDictV1 from "./v1";
import routerDictV1_1 from "./v2";
import { HttpMethod } from "../types";

const router = new Router();

const methodToRouter = {
  [HttpMethod.HEAD]: router.head,
  [HttpMethod.OPTIONS]: router.options,
  [HttpMethod.GET]: router.get,
  [HttpMethod.PUT]: router.put,
  [HttpMethod.PATCH]: router.patch,
  [HttpMethod.POST]: router.post,
  [HttpMethod.DELETE]: router.delete,
};

const setRoutes = (router: Router, routeDicts: IRouteDict[]) => {
  // Get all of the route keys.
  let routeKeys: string[] = [].concat.apply(
    [],
    routeDicts.map((dict) => Object.keys(dict))
  );
  routeKeys = [...new Set(routeKeys)];

  routeKeys.forEach((routeKey: string) => {
    // Get the routes for this key for all of the versions
    const routesForKey = routeDicts
      .map((routeDict) => routeDict[routeKey])
      .filter(Boolean);
    if (!routesForKey.length) {
      return;
    }

    const mergedRoutesForKey = routesForKey.reduce(
      (acc, cur) => ({
        ...acc,
        [cur.version]: cur.handler,
      }),
      {}
    );
    const firstRouteForKey =
      routesForKey.filter((x) => x.version === "2.0.0").length > 0
        ? routesForKey.filter((x) => x.version === "2.0.0")[0]
        : routesForKey.filter((x) => x.version === "1.0.0")[0];
    const routeRegisterHandler = methodToRouter[firstRouteForKey.method];

    // Use this line to dump the merged routes
    console.log(
      "-------------",
      firstRouteForKey.method,
      firstRouteForKey.path,
      mergedRoutesForKey
    );
    if (firstRouteForKey.middleware) {
      if (Array.isArray(firstRouteForKey.middleware)) {
        routeRegisterHandler.call(
          router,
          "/:version(v\\d)?" + firstRouteForKey.path,
          ...firstRouteForKey.middleware,
          KoaRouterVersion.version(mergedRoutesForKey, {
            fallbackLatest: true,
          })
        );
      } else {
        routeRegisterHandler.call(
          router,
          "/:version(v\\d)?" + firstRouteForKey.path,
          firstRouteForKey.middleware,
          KoaRouterVersion.version(mergedRoutesForKey, {
            fallbackLatest: true,
          })
        );
      }
    } else {
      routeRegisterHandler.call(
        router,
        "/:version(v\\d)?" + firstRouteForKey.path,
        KoaRouterVersion.version(mergedRoutesForKey, {
          fallbackLatest: true,
        })
      );
    }
  });
};

setRoutes(router, [routerDictV1, routerDictV1_1]);

export default Compose([router.routes(), router.allowedMethods()]);
