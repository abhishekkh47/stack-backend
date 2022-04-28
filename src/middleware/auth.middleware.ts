import { verifyToken } from "../utility";

export const Auth = () => {
  return (_: Object, __?: string, descriptor?: PropertyDescriptor) => {
    const fn: Function = descriptor.value;
    descriptor.value = async function (ctx: any) {
      const token =
        <string>ctx.request.headers["x-access-token"] ||
        (ctx.request.query.token as string);
      if (!token) {
        return this.UnAuthorized(ctx, "Invalid JWT Token");
      }

      try {
        const response = await verifyToken(token);
        ctx.request.user = response;
      } catch (err) {
        return this.UnAuthorized(ctx, "Invalid JWT Token");
      }
      return await fn.apply(this, [ctx]);
    };
  };
};
