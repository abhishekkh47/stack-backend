"use strict";
export const CONSTANT = Object.freeze({
  VerifyEmailTemplateId: "d-024fedc867e0407ab4971e642354168f",
  ResetPasswordTemplateId: "d-272f7e39cb4a4220ac7809d64f99e516",
  HelpCenterTemplateId: "d-614d94dc58d6436eb23d17a7757a9da5",
  RemindParentTemplateId: "d-29e6c014f3604c04b7c7c2d354bda66e",
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
  accountAssetTotals: (accountId) =>
    `v2/account-asset-totals?account.id=${accountId}`,
  pushTransferMethodGet: (id) => `v2/push-transfer-methods/${id}`,
};
export const COINMARKETCAPAPIS = {
  historicalPrice: (crypto) =>
    `v2/cryptocurrency/price-performance-stats/latest?symbol=${crypto}&time_period=90d,365d`,
  latestPrice: (crypto) => `v2/cryptocurrency/quotes/latest?symbol=${crypto}`,
};

export const PLAIDAPIS = {
  getLinkToken: "link/token/create",
  publicTokenExchange: "item/public_token/exchange",
  createProcessorToken: "processor/token/create",
  getAccounts: "accounts/get",
  getInstitutionById: "institutions/get_by_id",
  institutionsGetById: "institutions/get_by_id",
};

export const ZOHOAPIS = {
  getAccessToken: "oauth/v2/token",
  accountUpsert: "crm/v2/Accounts/upsert",
};

export const DROPDOWNLIST = {
  page: 1,
  limit: 10,
};

export const FIREBASE_CREDENCIALS = {
  type: "service_account",
  project_id: "temp-demo-push-notification",
  private_key_id: "a4b2e11cfdbed032856e4564909a75bb1a5ebc46",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCijuOdZJk4EBhU\nRW6ifhEM3kbBZ2DlGieSzKeBIysqWx7CSUzJJGPsgDR6nNIIvY4ZdpdoL9RAx/ic\nfHVfgzRfVcs+G7/2XQFALoM4r7oRy1Nb6sDdgeHCkyXy2k3gXuj9zRcjlD/EJBL6\nRzg5dlqk4SlCuHSMdFYrvBkQcBa4dKyD+jtwuF+6Q5V0sKn4HqD6tTCpW2UENlVN\nLNICIw+Ef62gBnx5ox/+y9Fg9C+rWn7ZgnKFASpNKebQBN/KpEr67ct9fNOwTJc+\nLwbQIQNgyfnwX2JofrrjIeNviZq4ahgMPgVR90NeW0jkh+9mtSOySGhoh/9bnhj/\nVGH15mndAgMBAAECggEACJca9aQNib4l/vwNUOZvEbpETG+hWfIEIdiRSHx6iTo3\n+aXkeiOjaSnMPCeB3ObhdbyD20Rdx8+ZdnGIRVQaZihTPXS7c/ItwP3EPvBgWZTg\nUpTo/LuimcTrZjY9k8wILXNTU/S/WubaHuI5GSZFO33Pj6BOPmbeb+C4hVsbBEPG\ngTsc+w3hzSPTy/dzEH3Gf5LKKTaU77+GyPR0a9oCrUyyfsCSJLuJtvsS79jheCpW\n9LgY33+g1QCkgf8jLafFb5Apx5eaCMKQnD7OAnNiDqIwC72PaR4QmoLTytfyrTbL\nMHNJYSKnwVu2d0nTsslC4MkaWux+C68zMXZxYgCW8QKBgQDdU+YQ92DJowbrfB8c\ngSBmFzKcbj57iAcCXbaDSDF1+Tb/fnQlayHBHsgdQG7McBtz80I/ZgOxOZLJkGfu\nS+TtRmZq7Hbp4Hxa7QkwUT5Y1zsByFhsf/n9DpXw7J7nJgiv2xQnGhxpK/xwAzxr\nR01z/1PH4mzP+5btMjqvYafujQKBgQC8Bho/o7B8DRm97QTdLB/+SUsyRQAJHdR5\nnWmtMM+Apbzb7X2mhAEy7cdtwxBecReGHjjWgw7RycP7ecbONs9Ae4LvaiHKOLvv\nmmOrtvFDu7aAtWOzBFUVmn0Hu2RCgC4dRovg9X3VVejPwEABEwuIvYJITK6xVIP0\nlxLyBix8kQKBgQC1cZV3rUXUp+kBXnUm6hkEeNoN8jcZEJAmeWspvyKFQ7S5yhIv\npt86MiD+EheDVBi9etyBmwFF5hwXUGJTsjZP6toFqCtoWpe39wEEcmY5cOE3+eW7\ntULdGXsE0wcGGmEeweyIjdhixCOkNJLwo7i0cspdYJux+eBmPjpsExQX9QKBgQCy\nMpZt+hUpfMEI37ncZBVuSsiZvAtsmHjnSej922TN6EY1qb+MMU9xlSmNPXImD8jb\ns4jqxQsmiLLVg3SHvCpwUp6liVC890gmrYwJEjlWmHE/SqpS36hD8UbOLSu4WwNZ\ne6LWcdPwfJtJSkteuU4VKoZvPz3Rkuf8x7GM74z6AQKBgQChvJAMeleb1mMODeBO\nthG7jaYT32rxUWl03vmwpSSneNn2fJ3WeKXYwGNtkvXJahDtIaPU6RYeTq6QcJOJ\nGKMk91A3CPwAvGHFkc4Jww1HeQ5mAHLRE4Xr1g15s81TXBRdHnaXS6YTFrKnQPLQ\nueZaxGasbXY5H33y4uPG7GCFHw==\n-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-zfogf@temp-demo-push-notification.iam.gserviceaccount.com",
  client_id: "115157352245474769299",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-zfogf%40temp-demo-push-notification.iam.gserviceaccount.com",
};

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
    "You have earned 1000 Stack coins from referring a friend! 🥳",
  SUCCESS_REFER_CODE_USE_MESSAGE:
    "You have been gifted 1000 Stack coins by using correct referral code 🥳",
  EARN_STACK_COINS_AFTER_SUCCESSFUL_KYC:
    "You have been gifted 1000 Stack coins as your parent's kyc got approved 🥳",
};

export const NOTIFICATION_KEYS = {
  TRADING: "trading",
  KYC_SUCCESS: "kyc_success",
  KYC_FAILURE: "kyc_failure",
  KYC_PENDING: "kyc_pending",
  FREIND_REFER: "refer_freind",
  EARN_STACK_COINS_AFTER_KYC_APPROVED: "earn_stack_coins_after_kyc_approved",
};
