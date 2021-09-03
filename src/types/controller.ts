import * as Koa from 'koa';

export enum HttpMethod {
  HEAD = 1,
  OPTIONS = 2,
  GET = 4,
  PUT = 8,
  PATCH = 16,
  POST = 32,
  DELETE = 64,
}

export interface IControllerRoute {
  order?: number;
  method: HttpMethod;
  path: string;
  handler: (ctx: Koa.Context) => Promise<void>;
  middleware?: Koa.Middleware | Koa.Middleware[];
}

export interface IController {
  routes: IControllerRoute[];
}

export interface IRouteParams {
  path: string;
  order?: number;
  method?: HttpMethod;
  middleware?: Koa.Middleware | Koa.Middleware[];
}
