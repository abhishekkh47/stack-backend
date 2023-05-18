import { getJwtToken, getRefreshToken } from "@app/utility";
import { AuthService } from ".";

class TokenService {
  public async generateToken(userExists: any) {
    const authInfo = await AuthService.getJwtAuthInfo(userExists);
    const refreshToken = await getRefreshToken(authInfo);

    const token = await getJwtToken(authInfo);
    return { token, refreshToken };
  }
}

export default new TokenService();
