import paypal from "@paypal/checkout-server-sdk";

import config from "@app/config";
import { logger } from "@app/utility";

export interface CreateOrderRequestsPayload {
  amount: string;
  currencyCode?: "USD";
}

export default class PaypalService {
  private clientId: string;
  private clientSecret: string;
  private environment: any;
  private client: any;

  constructor() {
    this.clientId = config.PAYPAL_CLIENT_ID;
    this.clientSecret = config.PAYPAL_CLIENT_SECRET;
    this.environment = new paypal.core.SandboxEnvironment(
      this.clientId,
      this.clientSecret
    );
    this.client = new paypal.core.PayPalHttpClient(this.environment);
  }

  public async createOrderRequests({
    amount,
    currencyCode = "USD",
  }: CreateOrderRequestsPayload) {
    const createOrderRequest = new paypal.orders.OrdersCreateRequest();
    createOrderRequest.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currencyCode,
            value: amount,
          },
        },
      ],
    });

    return await this.executeRequest(createOrderRequest);
  }

  public async captureTransaction(orderId: string) {
    const captureTransactionRequest = new paypal.orders.OrdersCaptureRequest(
      orderId
    );
    captureTransactionRequest.requestBody({});

    return await this.executeRequest(captureTransactionRequest);
  }

  private async executeRequest(request: any) {
    try {
      const response = await this.client.execute(request);
      logger.log("info", JSON.stringify(response));
      return response.result;
    } catch (err) {
      logger.log("error", err);
    }
  }
}
