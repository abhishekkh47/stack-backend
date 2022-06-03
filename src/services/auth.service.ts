import { UserTable, IUserSchema } from "../model";
import { IUser } from "../types";
import bcrypt from "bcrypt";

class AuthService {
  async findUserByEmail(email: string) {
    return await UserTable.findOne({ email });
  }

  public comparePassword(password: string, input: string) {
    return bcrypt.compareSync(password, input);
  }

  public encryptPassword(password: string) {
    return bcrypt.hashSync(password, 10);
  }

  public async updateUserInfo(id: string, body: Partial<IUser>) {
    return await UserTable.updateOne({ _id: id }, { $set: body });
  }

  public async signupUser(body: IUser) {
    return await UserTable.create({
      email: body.email,
      password: this.encryptPassword(body.password),
      username: body.username,
    });
  }

  public async getJwtAuthInfo(user: IUserSchema) {
    const expiredOn = Date.now() + 36000;

    return {
      _id: user._id,
      issuedOn: Date.now(),
      expiredOn,
      email: user.email,
      username: user.username,
    };
  }
}

export default new AuthService();
