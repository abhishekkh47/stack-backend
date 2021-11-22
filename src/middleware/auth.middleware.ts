import { verifyToken } from "@app/utility";

export const Auth = () => {
  return (_: Object, __?: string, descriptor?: PropertyDescriptor) => {
    const fn: Function = descriptor.value;
    descriptor.value = async function (ctx: any) {
      console.log('temp',ctx);
      const token =
        <string>ctx.request.headers["x-access-token"] ||
        (ctx.request.query.token as string);
      if (!token) {
        throw new Error("Invalid JWT token.");
      }

      try {
        const response = await verifyToken(token);
        ctx.request.user = response;
      } catch (err) {
        throw new Error("Invalid JWT token.");
      }
      return await fn.apply(this, [ctx]);
    };
  };
};
