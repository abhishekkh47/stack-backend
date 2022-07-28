import { OAuth2Client } from "google-auth-library";
import { AppleSignIn } from "apple-sign-in-rest";

import envData from "../config/index";

const google_client = new OAuth2Client(envData.GOOGLE_CLIENT_ID);
const apple_client: any = new AppleSignIn({
  clientId: envData.APPLE_CLIENT_ID,
  teamId: envData.APPLE_TEAM_ID,
  keyIdentifier: envData.APPLE_KEY_IDENTIFIER,
  privateKey: envData.APPLE_PRIVATE_KEY,
});
class SocialService {
  public async verifySocial(reqParam: any) {
    const { email, loginType, socialLoginToken: socialLoginToken } = reqParam;
    /**
     * Sign in type 1 - google and 2 - apple
     */
    switch (loginType) {
      case 1:
        const googleTicket: any = await google_client
          .verifyIdToken({
            idToken: socialLoginToken,
            audience: envData.GOOGLE_CLIENT_ID,
          })
          .catch((error) => {
            throw Error("Error Invalid Token Id");
          });
        const googlePayload = googleTicket.getPayload();
        if (!googlePayload) {
          throw Error("Error while logging in");
        }
        if (googlePayload.email != email) {
          throw Error("Email Doesn't Match");
        }
        break;
      case 2:
        const appleTicket: any = await apple_client
          .verifyIdToken(socialLoginToken)
          .catch((err) => {
            throw Error("Error Invalid Token Id");
          });
        if (appleTicket.email != email) {
          throw Error("Email Doesn't Match");
        }
        break;
    }
  }
}

export default new SocialService();
