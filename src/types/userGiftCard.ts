import mongoose from "mongoose";

export interface IUserGiftCard {
  uuid: string;
  sender_name: string;
  sender_email: string;
  recieptent_email: string;
  issued_giftcard_order_id: number;
  send_on_date: string;
  message_text: string;
  amount: number;
  recipient_phone: string;
  redeemed: boolean;
}

