import moment from "moment";
import { AdminTable } from "@app/model";
import {
  getPrimeTrustJWTToken,
  getUser,
  verifyToken,
  getAccessToken,
} from "@app/utility";
export const PrimeTrustJWT = (isZohoCrmApplicable: boolean = null) => {
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
        token = token.data;
      }
      ctx.request.primeTrustToken = token;
      if (isZohoCrmApplicable) {
        let difference = Math.ceil(
          moment
            .duration(
              moment(moment().valueOf()).diff(moment(admin.zohoExpiryTime))
            )
            .asMinutes()
        );
        if (difference >= 45) {
          const getAccess: any = await getAccessToken(admin.zohoRefreshToken);
          if (getAccess.data) {
            ctx.request.zohoExpiryTime = moment().valueOf();
            ctx.request.zohoAccessToken = getAccess.data.access_token;
            await AdminTable.updateOne(
              { _id: admin._id },
              {
                $set: {
                  zohoExpiryTime: moment().valueOf(),
                  zohoAccessToken: getAccess.data.access_token,
                },
              }
            );
          }
        } else {
          ctx.request.zohoExpiryTime = admin.zohoExpiryTime;
          ctx.request.zohoAccessToken = admin.zohoAccessToken;
        }
      }
      return await fn.apply(this, [ctx]);
    };
  };
};
