"use strict";
export const CONSTANT = Object.freeze({
  VerifyEmailTemplateId: "d-024fedc867e0407ab4971e642354168f",
  ResetPasswordTemplateId: "d-272f7e39cb4a4220ac7809d64f99e516",
  HelpCenterTemplateId: "d-614d94dc58d6436eb23d17a7757a9da5",
  RemindParentTemplateId: "d-29e6c014f3604c04b7c7c2d354bda66e",
  DripShopTemplateId: "d-cabccd32eed84d879877c7d5a21e93da",
});

export const PRIMETRUSTBASEAPIURL = "";

export const PRIMETRUSTAPIS = {
  jwt: "auth/jwts",
  getUser: "v2/users",
  uploadFiles: "v2/uploaded-documents",
  accountCreate: "v2/accounts?include=contacts",
  agreementPreviews: "v2/agreement-previews",
  kycDocumentChecks: "v2/kyc-document-checks",
  createFundTransferMethod: "v2/funds-transfer-methods",
  contributions: "v2/contributions?include=funds-transfer",
  disbursements: "v2/disbursements?include=funds-transfer",
  pushTransfer: "v2/push-transfer-methods",
  getBalance: (id) => `v2/account-cash-totals?account.id=${id}`,
  generateQuote: () => `v2/quotes?include=asset`,
  executeQuote: (id) => `v2/quotes/${id}/execute`,
  wireInbound: (id) =>
    `v2/push-transfer-methods/${id}/sandbox/inbound-wire?include=funds-transfers`,
  getAssets: (page, limit) =>
    `v2/assets?page[size]=${limit}&page[number]=${page}`,
  getPushTransfer: (accountId) =>
    `v2/push-transfer-methods?account.id=${accountId}`,
  updateContacts: (contactId) => `v2/contacts/${contactId}`,
  pushTransferMethod: `v2/push-transfer-methods`,
  accountAssetTotalWithId: (accountId, assetId) =>
    `v2/account-asset-totals?account.id=${accountId}&asset.id=${assetId}`,
  accountAssetTotals: (accountId) =>
    `v2/account-asset-totals?account.id=${accountId}`,
  pushTransferMethodGet: (id) => `v2/push-transfer-methods/${id}`,
  getAccountByAccountId: (accountId) => `v2/accounts/${accountId}`,
  getQuoteInformation: (quoteId) => `v2/quotes/${quoteId}`,
  getInternalTransferInformation: (quoteId) =>
    `v2/internal-asset-transfers/${quoteId}`,
  internalAssetTransfers: `v2/internal-asset-transfers`,
  pendingClosure: (accountId) => `v2/accounts/${accountId}/pending-close`,
};

export const PLAIDAPIS = {
  getLinkToken: "link/token/create",
  publicTokenExchange: "item/public_token/exchange",
  createProcessorToken: "processor/token/create",
  getAccounts: "accounts/get",
  getInstitutionById: "institutions/get_by_id",
  institutionsGetById: "institutions/get_by_id",
  unlinkBankAccount: "/item/remove",
};

export const GIFTCARDAPIS = {
  getAllGiftCards: (page, limit) => `api/giftcards?page=${page}&limit=${limit}`,
  countGiftCards: "api/giftcards/count",
};

export const ZOHOAPIS = {
  getAccessToken: "oauth/v2/token",
  accountUpsert: "crm/v2/Accounts/upsert",
  getAccounts: "crm/v2/Accounts",
  updateAccountInfo: (id) => `crm/v2/Accounts/${id}`,
  searchAccounts: (phone) => `crm/v2/Accounts/search?phone=${phone}`,
  searchAccountsByEmail: (email) => `crm/v2/Accounts/search?email=${email}`,
  deleteAccounts: (id) => `crm/v2/Accounts/${id}`,
};

export const LIST = {
  page: 1,
  limit: 20,
};

export const GIFTCARDS = {
  page: 1,
  limit: 50,
};

export const CASH_USD_ICON = "CASH_USD.png";

export const NEXT_LEAGUE_UNLOCK_IMAGE = "disabled.png";

export const PLAID_ITEM_ERROR = "ITEM_LOGIN_REQUIRED";

export const NOTIFICATION = {
  TEEN_REQUEST_MADE: "A new request has been made 😃",
  TEEN_REQUEST_DENIED: "Your request is updated! ⭐",
  TEEN_REQUEST_APPROVED: "Your request is approved! 🎉",
  TEEN_REQUEST_BUY_CRYPTO:
    "Your child has requested to buy @crypto 🚀  Head to the app to review the request.",
  TEEN_REQUEST_SELL_CRYPTO:
    "Your child has requested to sell their holdings in @crypto 🚀  Head to the app to review the request.",
  TEEN_REQUEST_ADD_DEPOSIT:
    "Your child has requested a one-time deposit 💰 Head to the app to review the request.",
  TEEN_REQUEST_ADD_WITHDRAW:
    "Your child has requested a one-time withdrawal 💵 Head to the app to review the request.",
  TEEN_REQUEST_DENIED_DESCRIPTION: "Your request is updated! ⭐",
  TEEN_REQUEST_ADD_DEPOSIT_APPROVED:
    "Your request to deposit funds into your account was approved. What will you invest in next? 🚀 ",
  TEEN_REQUEST_ADD_WITHDRAW_APPROVED:
    "Your request to withdraw funds has been approved 🎩",
  TEEN_REQUEST_BUY_CRYPTO_APPROVED:
    "Your request to buy @crypto 🚀 has been approved!",
  TEEN_REQUEST_SELL_CRYPTO_APPROVED:
    "Your request to sell @crypto 🚀 has been approved!",
  KYC_PENDING_TITLE: "We are verifying your information.",
  KYC_PENDING_DESCRIPTION: "You'll be able to access your account soon ⏱",
  KYC_APPROVED_TITLE: "Your account has been approved 🥳",
  KYC_APPROVED_DESCRIPTION: "Explore our app for more features 🤩",
  KYC_REJECTED_TITLE: "Looks like we need additional information from you 👀",
  SUCCESS_REFER_MESSAGE:
    "You have earned 1000 Jetson coins from referring a friend! 🥳",
  SUCCESS_REFER_CODE_USE_MESSAGE:
    "You have been gifted 1000 Jetson coins by using correct referral code 🥳",
  EARN_STACK_COINS_AFTER_SUCCESSFUL_KYC:
    "You have been gifted 1000 Jetson coins as your parent's kyc got approved 🥳",
  ACCOUNT_CLOSED_TITLE: "Your account is closed",
  ACCOUNT_CLOSED_DESCRIPTION:
    "Thanks for applying, we can't open an account for you based on the info you provided",
  RECURRING_FAILED: "An error occurred while processing your deposit",
  RECURRING_FAILED_BANK_ERROR:
    "We couldn’t proceed with the recurring deposit because we couldn’t authenticate your bank account.",
  RECURRING_FAILED_INSUFFICIENT_BALANCE:
    "We couldn’t proceed with the recurring deposit because you don’t have a sufficient balance in your bank account.",
  NO_BANK_REMINDER_TITLE: "REMINDER",
  NO_BANK_REMINDER_MESSAGE: "Link your bank to activate your account.",
  NO_RECURRING_REMINDER_MESSAGE:
    "Hi! Your child, #firstName, asked you to set up recurring deposit.",
  GIFT_CARD_REDEEMED: "Gift card redeemed.",
  GIFT_CARD_REDEEM_MESSAGE:
    "🎉 Your ${amount} BTC Gift Card from {sender} is redeemed. Check out your latest portfolio 🤩",
  GIFT_CARD_ACITVITY_MESSAGE:
    "Redeemed ${amount} Bitcoin Gift Card from {sender}",
  REFERR_TITLE: "Congrats 🎉",
  REFERRAL_SENDER_MESSAGE:
    "You have received 20XP from referring your friend {friendName}! Be sure to say thanks.",
  REFERRAL_RECEIVER_MESSAGE:
    "You have received 20XP from your friend {friendName}! Be sure to say thanks.",
  DRIP_SHOP_MESSAGE:
    "Reedemed ${cryptoAmount} of ${cryptoName} in exchange of {fuelAmount} fuel",
};

export const NOTIFICATIONS = {
  REDEEM_BTC_SUCCESS: {
    key: "redeem_btc_success",
    title: "Hi! It's Jetson.",
    message: "🎉 We just sent you $5 Bitcoin. Time to show off!",
    nameForTracking: "Bitcoin redeemed",
  },
  COMPLETE_KYC_REMINDER: {
    key: "complete_kyc_reminder",
    title: "Hi! It's Jetson.",
    message:
      "⏰ Complete the onboarding to unlock your child’s financial future.",
    nameForTracking: "Parent KYC reminder 1",
  },
};

export const PT_REFERENCE_TEXT = "$5 BTC gift from Jetson";
export const QUIZ_LIMIT_REACHED_TEXT =
  "Quiz domination reached. Please wait for next day to unlock this quiz";

export const NOTIFICATION_KEYS = {
  FRIEND_REFER: "refer_friend",
  GIFT_CARD_ISSUED: "gift_card_issued",
  EARN_STACK_COINS_AFTER_KYC_APPROVED: "earn_stack_coins_after_kyc_approved",
};

export const PARENT_SIGNUP_FUNNEL = {
  SIGNUP: [
    "Sign up with SSO",
    // "Enter phone number",
    // "Enter child's phone number",
    // "Enter name, birth, SSN",
  ],
  DOB: "Enter DOB",
  MOBILE_NUMBER: "Enter mobile",
  CHILD_INFO: "Enter child's information",
  CONFIRM_DETAILS: "Confirm user details",
  UPLOAD_DOCUMENT: "Upload ID",
  ADD_BANK: "Add a bank",
  FUND_ACCOUNT: "Fund account",
  SUCCESS: "Registration complete",
};

export const TEEN_SIGNUP_FUNNEL = {
  SIGNUP: "Sign up with SSO",
  DOB: "Enter DOB",
  PHONE_NUMBER: "Enter phone number",
  PARENT_INFO: "Enter parent's info",
  SUCCESS: "Registration complete",
};

export const CMS_LINKS = {
  TERMS: "https://www.trystack.io/terms",
  AMC_POLICY: "",
  PRIVACY_POLICY: "https://www.trystack.io/privacy",
  PRIME_TRUST_USER_AGREEMENT:
    "https://www.primetrust.com/legal/terms-of-service",
};

export const ANALYTICS_EVENTS = {
  BANK_CONNECTED: "Bank Connected",
  BUY_ORDER_INITIATED: "Buy Order Initiated",
  DEPOSIT_INITIATED: "Deposit Initiated",
  SELL_ORDER_INITIATED: "Sell Order Initiated",
  CHILD_INFO_SUBMITTED: "Child Info Submitted",
  CONFIRM_DETAILS_SUBMITTED: "Confirm Details Submitted", // front-end?
  DOB_SUBMITTED: "DOB Submitted",
  PHONE_NUMBER_SUBMITTED: "Phone Number Submitted",
  PHONE_NUMBER_VERIFIED: "Phone Number Verified",
  SIGNED_UP_SSO: "Signed Up with SSO",
  UPLOAD_DL_SUBMITTED: "Upload DL Submitted",
  CHALLENGE_COMPLETED: "Challenge Completed",
  PUSH_NOTIFICATION_SENT: "Push Notification Sent",
  PARENT_SIGNED_UP: "Parent Signed Up",
  PARENT_KYC_APPROVED: "Parent KYC Approved",
  CHALLENGE_REVIEW_SUBMITTED: "Challenge Review Submitted",
  KYC_APPROVED: "KYC Approved",
  KYC_SUBMITTED: "KYC Submitted",
};

export const XP_POINTS = {
  CORRECT_ANSWER: 5,
  COMPLETED_QUIZ: 10,
  REFERRAL: 20,
};

export const LEVELS = {
  LEVEL1: { level: 1, maxValue: 3 },
  LEVEL2: { level: 2, maxValue: 7 },
  LEVEL3: { level: 3, maxValue: 14 },
  LEVEL4: { level: 4, maxValue: 30 },
  LEVEL5: { level: 5, maxValue: 50 },
  LEVEL6: { level: 6, maxValue: 100 },
};

export const DEFAULT_TIMEZONE = "America/New_York";
