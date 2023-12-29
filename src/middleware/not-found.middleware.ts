import Koa from "koa";

export const notFoundHandler = async (ctx: Koa.Context | any) => {
  if (ctx.path === "/alive") {
    ctx.body = {
      status: "ok",
      timestamp: Date.now(),
    };
    return;
  }

  ctx.status = 404;
  ctx.body = {
    code: 404,
    message: "Requested path not found",
    path: ctx.path,
    success: false,
  };
};
