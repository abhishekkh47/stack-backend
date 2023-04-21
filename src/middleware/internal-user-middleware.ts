import { AdminTable } from "@app/model";
import { verifyToken } from "@app/utility";

export const InternalUserAuth = () => {
  return (_: Object, __?: string, descriptor?: PropertyDescriptor) => {
    const fn: Function = descriptor.value;
    descriptor.value = async function (ctx: any) {
      const token =
        (<string>ctx.request.headers &&
          ctx.request.headers["x-access-token"]) ||
        (ctx.request.query.token as string);
      if (!token) {
        return this.UnAuthorized(ctx, "Invalid JWT Token");
      }
      try {
        const response = await verifyToken(token);
        if (response && response.status && response.status === 401) {
          return this.UnAuthorized(ctx, "Invalid JWT Token");
        }
        const admin = await AdminTable.findOne({});
        if (admin.token !== token) {
          return this.UnAuthorized(ctx, "Invalid JWT Token");
        }
        ctx.request.user = response;
      } catch (err) {
        return this.UnAuthorized(ctx, "Invalid JWT Token");
      }
      return await fn.apply(this, [ctx]);
    };
  };
};
