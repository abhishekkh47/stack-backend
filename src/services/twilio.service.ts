import config from "../config";

class TwilioService {
  /**
   * This service is used to send message to the receiver phone number
   * @param phoneNo
   * @param message
   * @returns
   */
  sendSMS(phoneNo: string, message: string) {
    return new Promise((resolve, reject) => {
      const client = require("twilio")(
        config.TWILIO_ACCOUNT_SID,
        config.TWILIO_AUTH_TOKEN
      );
      client.messages
        .create({
          body: message,
          from: config.TWILIO_PHONE_NUMBER,
          to: phoneNo,
        })
        .then((messageData: any) => {
          return resolve({
            code: 200,
            message: messageData.sid,
          });
        })
        .catch((error) => {
          return reject({
            code: 400,
            message: "Twilio Error Invalid Number",
          });
        });
    });
  }
}
export default new TwilioService();
