import * as Koa from 'koa';

import { logger } from '@app/utility';

export const errorHandler = async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next();
  } catch (e) {
    const status = e.status || 500;
    const message = status === 500 ? 'Internal server error' : e.message || 'Unknown';
    const messages = e.messages || [];

    if (status === 500) {
      logger.error('error', e.message);
    }

    ctx.status = status;
    ctx.body = {
      code: status,
      message,
      messages,
      path: ctx.path,
    };
  }
};
