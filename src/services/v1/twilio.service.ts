import { OtpTable } from "@app/model";
import { EOTPTYPE } from "@app/types";
import { generateRandom6DigitCode } from "@app/utility";

import config from "@app/config";

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
            message: "Error Invalid Number",
          });
        });
    });
  }

  public async sendOTP(mobile: string, type: EOTPTYPE) {
    const code = generateRandom6DigitCode(true);
    const message: string = `Your Jetson verification code is ${code}. Please don't share it with anyone.`;
    /**
     * Send Otp to User from registered mobile number
     */
    const twilioResponse: any = await this.sendSMS(mobile, message);
    if (twilioResponse.code === 400) {
      throw new Error("Error in sending OTP");
    }
    await OtpTable.create({
      message,
      code,
      receiverMobile: mobile,
      type,
    });
  }
}
export default new TwilioService();
