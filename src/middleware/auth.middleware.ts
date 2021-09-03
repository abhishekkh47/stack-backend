import Koa from 'koa';

export const authMiddleware = async (ctx: Koa.Context, next: Koa.Next) => {
  await next();
};
