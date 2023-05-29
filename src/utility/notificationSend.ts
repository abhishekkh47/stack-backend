const FCM = require("fcm-node");
import envData from "@app/config";
const fcm = new FCM(envData.FIREBASE_SERVER_KEY);
export const sendNotification = async (to, body, data, action = null) => {
  if (!to) {
    return;
  }
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
      badge: 1,
    },
    priority: "high",
    "content-available": true,
    data: data,
  };
  await fcm.send(message, function (err, resp) {
    if (err) {
      console.log("Something has gone wrong!", err);
    } else {
      console.log("Notification Successfully sent", resp);
    }
  });
};
