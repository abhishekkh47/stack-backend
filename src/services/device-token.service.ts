import { DeviceToken } from "../model";

class DeviceTokenService {
  public async addDeviceTokenIfNeeded(userId: string, deviceToken: string) {
    if (!deviceToken) {
      return;
    }

    const checkDeviceTokenExists = await DeviceToken.findOne({
      userId,
      deviceToken: deviceToken,
    });
    if (!checkDeviceTokenExists) {
      await DeviceToken.create({
        userId,
        deviceToken: deviceToken,
      });
    }
    let deviceTokens = await DeviceToken.distinct("deviceToken", {
      userId: userId,
    });
    return deviceTokens;
  }

  public async removeDeviceToken(userId: string, deviceToken: string) {
    const deviceTokens = await DeviceToken.findOne({
      userId: userId,
      deviceToken: deviceToken,
    });
    if (deviceTokens) {
      await DeviceToken.deleteOne({
        userId: userId,
        deviceToken: deviceToken,
      });
    } else {
      throw new Error("Device Token Doesn't Exist");
    }
  }
}

export default new DeviceTokenService();
