import { AdminTable } from "@app/model";
import { AuthService } from "@app/services/v1";
import { getJwtToken } from "@app/utility";
import envData from "@app/config";

export const rotateTokenHandler = async () => {
  console.log("==========Start Cron for Rotating Tokens=============");
  let admin: any = await AdminTable.findOne({});
  if (!admin || !admin.token) {
    return false;
  }
  const authInfo = await AuthService.getInternalJwtAuthInfo(
    envData.INTERNAL_USER_PASSWORD
  );
  const token = await getJwtToken(authInfo, "2d");
  await AdminTable.updateOne(
    {},
    {
      $set: {
        token,
      },
    }
  );
  return true;
};
