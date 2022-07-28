
import {
  getJwtToken,
  getRefreshToken,
} from "../utility";
import { AuthService } from "../services";

class TokenService {
  public async generateToken(userExists: any) {
    const authInfo = await AuthService.getJwtAuthInfo(userExists);
    const refreshToken = await getRefreshToken(authInfo);
    userExists.refreshToken = refreshToken;
    await userExists.save();

    const token = await getJwtToken(authInfo);
    return { token, refreshToken }
  }
}

export default new TokenService();
