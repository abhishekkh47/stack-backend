import Circle, { ICircleCreateCardPayload } from "circle-sdk/src";
import * as openpgp from "openpgp";
import atob from "atob";
import btoa from "btoa";
import { v4 as uuid } from "uuid";

import config from "@app/config";
import { nanoid } from "nanoid";

interface PublicKey {
  keyId: string;
  publicKey: string;
}

interface CircleResponse<T = any> {
  data: T;
}

interface ICardDetailsEncryption {
  number: string;
  cvv: string;
}

interface IMetadata {
  email: string;
  phoneNumber?: string;
  sessionId: string;
  ipAddress: string;
}

interface ICreateCardPayload extends ICardDetailsEncryption {
  expMonth: number;
  expYear: number;
  billingDetails: ICircleCreateCardPayload["billingDetails"];
  metadata: IMetadata;
}

interface IChargePayment extends ICreateCardPayload {
  amount: number;
}

export default class CircleService {
  private client: Circle;
  private disable = process.env.DISABLE_CIRCLE || true;
  constructor() {
    this.client = new Circle({
      apiKey: config.CIRCLE_API_KEY,
      baseUrl: config.CIRCLE_BASE_URL,
    });
    this.registerWebhook();
  }

  async registerWebhook() {
    if (config.CIRCLE_WEBHOOK_URL) {
      const response: any = await this.client.subscription.list();
      if (
        !response.data.find((x) => x.endpoint === config.CIRCLE_WEBHOOK_URL)
      ) {
        response.data.forEach(({ id }) => {
          this.client.subscription.remove(id);
        });
        console.log(
          await this.client.subscription.create({
            endpoint: config.CIRCLE_WEBHOOK_URL,
          })
        );
      }
    }
  }

  public async encrypt(dataToEncrypt: ICardDetailsEncryption) {
    const response =
      (await this.client.encryption.getPublicKey()) as CircleResponse<PublicKey>;

    const { keyId, publicKey } = response.data;
    const decodedPublicKey = atob(publicKey);

    const encryptedData = await openpgp.encrypt({
      encryptionKeys: [await openpgp.readKey({ armoredKey: decodedPublicKey })],
      message: await openpgp.createMessage({
        text: JSON.stringify(dataToEncrypt),
      }),
    });

    return {
      encryptedData: btoa(encryptedData) as any,
      keyId,
    };
  }

  public async createCard(payload: ICreateCardPayload) {
    try {
      const { number, cvv, ...rest } = payload;
      const { encryptedData, keyId } = await this.encrypt({
        cvv,
        number: number.trim().replace(/\D/g, ""),
      });
      const response: any = await this.client.card.create({
        encryptedData: encryptedData,
        keyId,
        billingDetails: rest.billingDetails,
        expMonth: rest.expMonth,
        expYear: rest.expYear,
        idempotencyKey: uuid(),
        metadata: rest.metadata,
      });
      return response.data;
    } catch (err) {
      console.log(err);
      throw new Error("Invalid card details");
    }
  }

  public async chargePaymentByCard(body: IChargePayment) {
    if (this.disable) {
      return {
        cardId: nanoid(),
        data: {
          id: nanoid(),
        },
      };
    }
    const { amount, ...rest } = body;
    let id = "";
    try {
      const response = await this.createCard(rest);
      console.log("card create", response);
      id = response.id;
    } catch (err) {
      throw new Error(err.message);
    }
    try {
      const payload: any = {
        amount: {
          amount: amount,
          currency: "USD",
        },
        idempotencyKey: uuid(),
        metadata: rest.metadata,
        verification: "cvv",
        source: {
          id,
          type: "card",
        },
      };
      const response: any = await this.client.payments.create(payload);
      console.log("payments create", response);
      return { ...response, cardId: id };
    } catch (err) {
      console.log(err);
      throw new Error("Payment failed");
    }
  }

  public async sendMoney(body: any) {
    if (this.disable) {
      return nanoid();
    }
    const walletId = await this.getPrimaryWallet();
    const response: any = await this.client.transfer.create({
      amount: body.amount,
      destination: body.destination,
      idempotencyKey: uuid(),
      source: {
        id: walletId,
        type: "wallet",
      },
    });
    return response?.data.id;
  }

  public async getPayment(paymentId: string) {
    if (this.disable) {
      return {
        data: {
          status: "success",
        },
      };
    }
    return (await this.client.payments.retrieve(paymentId)) as any;
  }

  public async getPrimaryWallet() {
    const wallets: any = await this.client.wallet.list({} as any);
    const primaryWallet = (wallets.data || []).find(
      (x) => x.type === "merchant"
    );
    return primaryWallet?.walletId;
  }
}
