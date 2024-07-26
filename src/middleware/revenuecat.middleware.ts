import { verifyRevenueCatAuth } from "@app/utility";

export const RevenueCatAuth = () => {
  return (_: Object, __?: string, descriptor?: PropertyDescriptor) => {
    const fn: Function = descriptor.value;
    descriptor.value = async function (ctx: any) {
      console.log("ctx.request.headers : ", ctx.request.headers);
      const token =
        (<string>ctx.request.headers && ctx.request.headers["authorization"]) ||
        (ctx.request.query.token as string);
      if (!token) {
        return this.UnAuthorized(ctx, "Invalid JWT Token");
      }
      try {
        const response = await verifyRevenueCatAuth(token);
        if (!response) {
          return this.UnAuthorized(ctx, "Invalid Subscription Authoization");
        }
        ctx.request.user = "revenucat";
      } catch (err) {
        return this.UnAuthorized(ctx, "Invalid JWT Token");
      }
      return await fn.apply(this, [ctx]);
    };
  };
};
