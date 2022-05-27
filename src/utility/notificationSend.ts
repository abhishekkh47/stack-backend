const FCM = require("fcm-node");
import envData from "../config/index";
import { FIREBASE_CREDENCIALS } from "../utility/constants";
const fcm = new FCM(envData.FIREBASE_SERVER_KEY);
export const sendNotification = async (to, body, data, action = null) => {
  if (to != null) {
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
    await fcm.send(message, function (err, resp) {
      console.log(err, "errorororor");
      if (err) {
        console.log("Something has gone wrong!", err.results);
      } else {
        console.log("Notification Successfully sent", resp);
      }
    });
  }
  // const admin = require("firebase-admin");
  // const { getMessaging } = require("firebase-admin/messaging");
  // if (!admin.apps.length) {
  //   admin.initializeApp({
  //     credential: admin.credential.cert(FIREBASE_CREDENCIALS),
  //   });
  // } else {
  //   admin.app(); // if already initialized, use that one
  // }
  // const message = {
  //   notification: {
  //     title: body,
  //     body: body,
  //   },
  //   tokens: to,
  // };
  // let notificationResponse = await admin.messaging().sendMulticast(message);
  // console.log(notificationResponse, "notificationResponse");
};
