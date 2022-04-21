import Koa from "koa";
import { v4 as uuid } from "uuid";

import { HttpMethod, ICreateGiftBody } from "@app/types";
import { generateHash, getSharableLink, Route } from "@app/utility";
import BaseTransactionController from "./base";
// import { CircleService } from "@app/services";
import { GiftsTable } from "@app/model";
import { Auth } from "@app/middleware";

const circle = null;

// Sample Payload For Sending Gift Card
// const payload = {
//   amount: 100,
//   billingDetails: {
//     city: "Test City",
//     country: "US",
//     line1: "Test",
//     name: "Customer 0001",
//     postalCode: "11111",
//     discount: "0",
//     line2: "",
//     district: "MA",
//   },
//   cvv: "123",
//   expMonth: 12,
//   expYear: 2025,
//   metadata: {
//     email: "davidwu@gmail.com",
//     ipAddress: "172.33.222.1",
//     sessionId: uuid(),
//     phoneNumber: "+12025550180",
//   },
//   number: "4007400000000007",
//   recieverEmail: "davidwu@gmail.com"
// }

// Sample Payload for sending money
// const payload = {
//   destination: {
//     type: "blockchain",
//     address: "0x493A9869E3B5f846f72267ab19B76e9bf99d51b1",
//     chain: "ETH",
//   },
//   amount: { amount: "0.10", currency: "USD" },
// };

class CircleController extends BaseTransactionController {
  @Route({ path: "/circle/supported-chains", method: HttpMethod.GET })
  public async getSupportedChains(ctx: Koa.Context) {
    const chains = [
      {
        name: "Ethereum",
        code: "ETH",
        currency: "USD",
      },
      {
        name: "Algorand",
        code: "ALGO",
        currency: "USD",
      },
      {
        name: "Solana",
        code: "SOL",
        currency: "USD",
      },
      {
        name: "Stellar",
        code: "XLM",
        currency: "USD",
      },
      {
        name: "TRON",
        code: "TRX",
        currency: "USD",
      },
      {
        name: "Hedera",
        code: "HBAR",
        currency: "USD",
      },
    ];

    return this.Ok(ctx, chains);
  }

  @Route({ path: "/circle/send-gift", method: HttpMethod.POST })
  @Auth()
  public async createCard(ctx: any) {
    const user = ctx.request.user;
    try {
      const body = <ICreateGiftBody>ctx.request.body;
      const chargePaymentBody = {
        amount: body.amount,
        metadata: body.metadata,
        number: body.number,
        cvv: body.cvv,
        expMonth: body.expMonth,
        expYear: body.expYear,
        billingDetails: body.billingDetails,
      };
      const response: any = await circle.chargePaymentByCard(chargePaymentBody);
      const giftCard = await GiftsTable.create({
        amount: body.amount,
        currency: "$",
        giftType: body.giftType,
        from: body.from,
        deliveryDate: body.deliveryDate,
        message: body.message,
        templateUrl: body.templateUrl,
        senderEmail: body.senderEmail,
        senderMobile: body.senderMobile,
        receiverEmail: body.receiverEmail,
        receiverNumber: body.receiverNumber,
        paymentId: response.data.id,
        cardId: response.cardId,
        qrId: body.qrId || "",
        hash: generateHash(
          JSON.stringify({
            amount: body.amount,
            sender: body.senderEmail,
            receiver: body.receiverEmail,
            type: body.giftType,
            paymentId: response.data.id,
          })
        ),
        owner: user._id,
      });
      this.onPaymentSuccess(giftCard);

      return this.Ok(ctx, { id: giftCard.hash, success: true });
    } catch (err) {
      return this.Ok(ctx, { success: false, message: err.message });
    }
  }

  @Route({ path: "/circle/send-money", method: HttpMethod.POST })
  @Auth()
  public async handleSendMoney(ctx: any) {
    const user = ctx.request.user;
    const payload = ctx.request.body;
    const gift = await GiftsTable.findOne({ _id: payload._id });
    if (!gift) {
      throw new Error("No gift card exists");
    }
    if (gift.transferId) {
      throw new Error("Payment already initiated.");
    }
    const transferId = await circle.sendMoney({
      destination: {
        type: "blockchain",
        address: payload?.destination?.address,
        chain: payload?.destination?.chain,
      },
      amount: {
        amount: gift.amount,
        currency: "USD",
      },
    });
    await gift.updateOne({ transferId, receiverId: user._id });

    return this.Ok(ctx, { success: true, message: "Transfer initiated" });
  }
}

export default new CircleController();
