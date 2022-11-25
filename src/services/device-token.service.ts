import { DeviceToken } from "../model";

class DeviceTokenService {
  public async addDeviceTokenIfNeeded(userId: string, deviceToken: string) {
    if (!deviceToken) {
      return;
    }

    const checkDeviceTokenExists = await DeviceToken.findOne({
      userId,
    });
    if (!checkDeviceTokenExists) {
      await DeviceToken.create({
        userId,
        "deviceToken.0": deviceToken,
      });
    } else {
      if (!checkDeviceTokenExists.deviceToken.includes(deviceToken)) {
        await DeviceToken.updateOne(
          { _id: checkDeviceTokenExists._id },
          {
            $push: {
              deviceToken: deviceToken,
            },
          }
        );
      }
    }
  }

  public async removeDeviceToken(userId: string, deviceToken: string) {
    const deviceTokens = await DeviceToken.findOne({ userId });
    if (deviceTokens.deviceToken.includes(deviceToken)) {
      await DeviceToken.updateOne(
        { userId },
        {
          $pull: {
            deviceToken: deviceToken,
          },
        }
      );
    } else {
      throw new Error("Device Token Doesn't Exist");
    }
  }
}

export default new DeviceTokenService();
