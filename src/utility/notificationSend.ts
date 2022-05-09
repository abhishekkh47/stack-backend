// const FCM = require("fcm-node");
// import FCM from "fcm-node";
import { FIREBASE_CREDENCIALS } from "./constants";
const serviceAccount = FIREBASE_CREDENCIALS;
// const fcm = new FCM(serviceAccount);
export const sendNotification = (to, body, data, action) => {
  if (to != null) {
    const message = {
      registration_ids: to,
      notification: {
        title: process.env.APP_NAME,
        body: body,
        sound: "default",
        icon: "ic_launcher_notification",
        color: "#ffffff",
        click_action: action,
        data: JSON.stringify(data),
      },
      data: data,
    };
    // fcm.send(message, function (err) {
    //   if (err) {
    //     console.log("Something has gone wrong!", err);
    //   } else {
    //     console.log("Notification Successfully sent");
    //   }
    // });
  }
};
