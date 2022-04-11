import { AdminTable } from "@app/model";
import { getPrimeTrustJWTToken, getUser, verifyToken } from "@app/utility";
export const PrimeTrustJWT = () => {
  return (_: Object, __?: string, descriptor?: PropertyDescriptor) => {
    const fn: Function = descriptor.value;
    descriptor.value = async function (ctx: any) {
      const admin = await AdminTable.findOne({});
      const isJwtValid = await getUser(admin.jwtToken);
      let token: any = admin.jwtToken;
      if (isJwtValid.status != 200) {
        token = await getPrimeTrustJWTToken();
        await AdminTable.updateOne(
          { _id: admin._id },
          {
            $set: {
              jwtToken: token.data,
            },
          }
        );
      }
      ctx.request.primeTrustToken = token;
      return await fn.apply(this, [ctx]);
    };
  };
};
