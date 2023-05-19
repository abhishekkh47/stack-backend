import { DeviceToken } from "@app/model";
import { ObjectId } from "mongodb";

class DeviceTokenDBService {
  /**
   * @description get the users token data
   * @param id
   */
  public async getDeviceTokenDataOfUser(id: any) {
    const queryFindDeviceTokenData = [
      {
        $match: { userId: new ObjectId(id) },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userNotificationInfo",
        },
      },
      {
        $unwind: {
          path: "$userNotificationInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$deviceToken",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$userId",
          deviceToken: {
            $addToSet: "$deviceToken",
          },
          isNotificationOn: {
            $first: "$userNotificationInfo.isNotificationOn",
          },
        },
      },
    ];
    let deviceTokenData: any = await DeviceToken.aggregate(
      queryFindDeviceTokenData
    ).exec();

    deviceTokenData = deviceTokenData.length > 0 ? deviceTokenData[0] : null;
    return deviceTokenData;
  }
}

export default new DeviceTokenDBService();
