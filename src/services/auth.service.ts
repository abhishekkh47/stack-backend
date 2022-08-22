import { UserTable, IUserSchema, StateTable } from "../model";
import { EUSERSTATUS, IUser } from "../types";
import bcrypt from "bcrypt";
import { getContactId, updateContacts } from "../utility";

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

  public async updatePrimeTrustData(
    input: any,
    userExists: any,
    primeTrustToken: any
  ) {
    const updates: any = {};
    const requestPrimeTrust = {};
    if (input["first-name"]) {
      updates.firstName = input["first-name"];
      requestPrimeTrust["first-name"] = input["first-name"];
    }
    if (input["last-name"]) {
      updates.lastName = input["last-name"];
      requestPrimeTrust["last-name"] = input["last-name"];
    }
    if (input["date-of-birth"]) {
      updates.dob = input["date-of-birth"];
      requestPrimeTrust["date-of-birth"] = input["date-of-birth"];
    }
    if (input["tax-id-number"]) {
      updates.taxIdNo = input["tax-id-number"];
      requestPrimeTrust["tax-id-number"] = input["tax-id-number"];
    }
    if (input["tax-state"]) {
      updates.taxState = input["tax-state"];
      requestPrimeTrust["tax-state"] = input["tax-state"];
    }
    if (
      input["primary-address"] &&
      Object.keys(input["primary-address"]).length > 0
    ) {
      requestPrimeTrust["primary-address"] = {};
      updates.city = input["primary-address"]["city"];
      requestPrimeTrust["primary-address"]["city"] =
        input["primary-address"]["city"];
      updates.unitApt = input["primary-address"]["unitApt"]
        ? input["primary-address"]["unitApt"]
        : userExists.unitApt;
      requestPrimeTrust["primary-address"]["street-2"] = input[
        "primary-address"
      ]["unitApt"]
        ? input["primary-address"]["unitApt"]
        : userExists.unitApt;
      updates.country = input["primary-address"]["country"];
      requestPrimeTrust["primary-address"]["country"] =
        input["primary-address"]["country"];
      updates.postalCode = input["primary-address"]["postal-code"];
      requestPrimeTrust["primary-address"]["postal-code"] =
        input["primary-address"]["postal-code"];
      updates.state = input["primary-address"]["region"];
      requestPrimeTrust["primary-address"]["region"] =
        input["primary-address"]["region"];
      updates.address = input["primary-address"]["street-1"];
      requestPrimeTrust["primary-address"]["street-1"] =
        input["primary-address"]["street-1"];
    }

    let contactId = await getContactId(userExists._id);
    if (!contactId) throw new Error("Contact ID not found");

    if (input["tax-state"]) {
      let taxState = await StateTable.findOne(
        { _id: input["tax-state"] },
        { shortName: 1, _id: 0 }
      );
      if (!taxState) throw new Error("Invalid Tax-State-ID entered");
      input["tax-state"] = taxState.shortName;
      requestPrimeTrust["tax-state"] = taxState.shortName;
    }
    if (
      input["primary-address"] &&
      Object.keys(input["primary-address"]).length > 0
    ) {
      let state = await StateTable.findOne({
        shortName: input["primary-address"].region,
      });
      if (!state) throw new Error("Invalid State-ID entered");
      input["primary-address"].region = state.shortName;
      requestPrimeTrust["primary-address"].region = state.shortName;
    }
    let response = await updateContacts(primeTrustToken, contactId, {
      type: "contacts",
      attributes: {
        "contact-type": "natural_person",
        ...requestPrimeTrust,
      },
    });
    if (response.status === 400) {
      throw new Error(response.message);
    }
    await UserTable.updateOne(
      { _id: userExists._id },
      {
        $set: {
          status: EUSERSTATUS.KYC_DOCUMENT_UPLOAD,
          ...updates,
        },
      }
    );
  }
}

export default new AuthService();
