const FCM = require("fcm-node");
import envData from "../config/index";
import { FIREBASE_CREDENCIALS } from "../utility/constants";
const fcm = new FCM(envData.FIREBASE_SERVER_KEY);
export const sendNotification = async (to, body, data, action = null) => {
  console.log(to.length > 0, "sendNotification");
  if (to.length > 0) {
    const message = {
      registration_ids: to,
      notification: {
        title: body,
        body: data.message,
        key: data.key,
        sound: "default",
        icon: "ic_launcher_notification",
        color: "#ffffff",
        priority: "high",
        "content-available": true,
        data: JSON.stringify(data),
      },
      priority: "high",
      "content-available": true,
      data: data,
    };
    return await fcm.send(message, function (err, resp) {
      if (err) {
        console.log("Something has gone wrong!", err.results);
        return false;
      } else {
        console.log("Notification Successfully sent", resp);
        return true;
      }
    });
  }
};
