export default {
  get PORT() {
    return process.env.PORT;
  },
  get APP_ENVIRONMENT() {
    return process.env.APP_ENVIRONMENT;
  },
  get PAYPAL_CLIENT_ID() {
    return process.env.PAYPAL_CLIENT_ID;
  },
  get PAYPAL_CLIENT_SECRET() {
    return process.env.PAYPAL_CLIENT_SECRET;
  },
  get STRIPE_PUBLISHABLE_KEY() {
    return process.env.STRIPE_PUBLISHABLE_KEY;
  },
  get STRIPE_SECRET_KEY() {
    return process.env.STRIPE_SECRET_KEY;
  },
  get DB_PATH() {
    return process.env.DB_PATH;
  },
  get SENDGRID_API_KEY() {
    return process.env.SENDGRID_API_KEY;
  },
  get SENDGRID_FROM_EMAIL() {
    return process.env.SENDGRID_FROM_EMAIL;
  },
  get GIFT_CARD_EXPIRED_IN_DAYS() {
    return 5;
  },
  get WEB_URL() {
    return process.env.WEB_URL;
  },
  get TWILIO_ACCOUNT_SID() {
    return process.env.TWILIO_ACCOUNT_SID;
  },
  get TWILIO_API_KEY() {
    return process.env.TWILIO_API_KEY;
  },
  get TWILIO_API_SECRET() {
    return process.env.TWILIO_API_SECRET;
  },
  get TWILIO_PHONE_NUMBER() {
    return process.env.TWILIO_PHONE_NUMBER;
  },
  get PRIMETRUSTAPI_URL() {
    return process.env.PRIMETRUSTAPI_URL;
  },
  get PLAID_CLIENT_ID() {
    return process.env.PLAID_CLIENT_ID;
  },
  get PLAID_SECRET() {
    return process.env.PLAID_SECRET;
  },
  get PLAID_ENV() {
    return process.env.PLAID_ENV;
  },
  get FIREBASE_SERVER_KEY() {
    return process.env.FIREBASE_SERVER_KEY;
  },
  get WEBHOOK_URL() {
    return process.env.WEBHOOK_URL;
  },
  get PT_USERNAME() {
    return process.env.PT_USERNAME;
  },
  get PT_PASSWORD() {
    return process.env.PT_PASSWORD;
  },
  get ZOHO_CLIENTID() {
    return process.env.ZOHO_CLIENTID;
  },
  get ZOHO_SECRETID() {
    return process.env.ZOHO_SECRETID;
  },
  get ZOHO_ACCOUNTURL() {
    return process.env.ZOHO_ACCOUNTURL;
  },
  get ZOHO_DOMAIN() {
    return process.env.ZOHO_DOMAIN;
  },
  get ZOHO_STAGING_DOMAIN() {
    return process.env.ZOHO_STAGING_DOMAIN;
  },
  get TOP_WAITLIST_USER() {
    return process.env.TOP_WAITLIST_USER;
  },
  get GOOGLE_CLIENT_ID() {
    return process.env.GOOGLE_CLIENT_ID;
  },
  get ANDROID_GOOGLE_CLIENT_ID() {
    return process.env.ANDROID_GOOGLE_CLIENT_ID;
  },
  get APPLE_CLIENT_ID() {
    return process.env.APPLE_CLIENT_ID;
  },
  get APPLE_TEAM_ID() {
    return process.env.APPLE_TEAM_ID;
  },
  get APPLE_KEY_IDENTIFIER() {
    return process.env.APPLE_KEY_IDENTIFIER;
  },
  get APPLE_PRIVATE_KEY() {
    return process.env.APPLE_PRIVATE_KEY;
  },
  get OPERATIONAL_ACCOUNT() {
    return process.env.OPERATIONAL_ACCOUNT;
  },
  get CONSTANT_BTC_COUNT() {
    return 0.00023427;
  },
  get INVITE_LINK() {
    return "https://stackapp.onelink.me/rBVF/grd8dnxd";
  },
  get PLAID_IOS_REDIRECT_URI() {
    return process.env.PLAID_IOS_REDIRECT_URI;
  },
  get ANDROID_PACKAGE_NAME() {
    return process.env.ANDROID_PACKAGE_NAME;
  },
  get GIFT_CARD_API_SECRET() {
    return process.env.GIFT_CARD_API_SECRET;
  },
  get GIFT_CARD_API_URL() {
    return process.env.GIFT_CARD_API_URL;
  },
  get GIFT_CARD_API() {
    return process.env.GIFT_CARD_API;
  },
  get APP_REFERRAL_COINS() {
    return parseInt(process.env.APP_REFERRAL_COINS);
  },
  get AMPLITUDE_KEY() {
    return process.env.AMPLITUDE_KEY;
  },
  get INTERNAL_USER_PASSWORD() {
    return process.env.INTERNAL_USER_PASSWORD;
  },
  get SHEET_ID() {
    return process.env.SHEET_ID;
  },
  get CLIENT_EMAIL() {
    return process.env.CLIENT_EMAIL;
  },
  get GOOGLE_SERVICEACCOUNT_PRIVATE_KEY() {
    return process.env.GOOGLE_SERVICEACCOUNT_PRIVATE_KEY;
  },
  get CATEGORY_SHEET_GID() {
    return process.env.CATEGORY_SHEET_GID;
  },
  get SIMULATION_QUIZ_GID() {
    return process.env.SIMULATION_QUIZ_GID;
  },
  get GOOGLE_PLACE_KEY() {
    return process.env.GOOGLE_PLACE_KEY;
  },
  get WEEKLY_CHALLENGE_STATE_MACHINE_ARN() {
    return process.env.WEEKLY_CHALLENGE_STATE_MACHINE_ARN;
  },
  get STORY_SHEET_GID() {
    return process.env.STORY_SHEET_GID;
  },
  get PASSION_SHEET_ID() {
    return process.env.PASSION_SHEET_ID;
  },
  get PASSION_SHEET_GID() {
    return process.env.PASSION_SHEET_GID;
  },
  get OPENAI_API_KEY() {
    return process.env.OPENAI_API_KEY;
  },
  get ACTION_SCREEN_COPY_SHEET_ID() {
    return process.env.ACTION_SCREEN_COPY_SHEET_ID;
  },
  get ACTION_SCREEN_COPY_SHEET_GID() {
    return process.env.ACTION_SCREEN_COPY_SHEET_GID;
  },
  get MENTORSHIP_PROGRAM_SHEET_GID() {
    return process.env.MENTORSHIP_PROGRAM_SHEET_GID;
  },
  get WEEKLY_JOURNEY_SHEET_GID() {
    return process.env.WEEKLY_JOURNEY_SHEET_GID;
  },
  get COACH_DETAILS_SHEET_GID() {
    return process.env.COACH_DETAILS_SHEET_GID;
  },
  get CHECKLIST_CONTENT_GID() {
    return process.env.CHECKLIST_CONTENT_GID;
  },
  get CASE_STUDY_GID() {
    return process.env.CASE_STUDY_GID;
  },
  get SERVER_ID() {
    return process.env.SERVER_ID;
  },
  get CHANNEL_ID() {
    return process.env.CHANNEL_ID;
  },
  get SALAI_TOKEN() {
    return process.env.SALAI_TOKEN;
  },
  get HUGGINGFACE_TOKEN() {
    return process.env.HUGGINGFACE_TOKEN;
  },
  get IMPORT_SERVER_ID() {
    return process.env.IMPORT_SERVER_ID;
  },
  get IMPORT_CHANNEL_ID() {
    return process.env.IMPORT_CHANNEL_ID;
  },
  get IMPORT_SALAI_TOKEN() {
    return process.env.IMPORT_SALAI_TOKEN;
  },
  get PRODUCT_PASSIONS_SHEET_GID() {
    return process.env.PRODUCT_PASSIONS_SHEET_GID;
  },
  get CONTENT_PASSIONS_SHEET_GID() {
    return process.env.CONTENT_PASSIONS_SHEET_GID;
  },
  get MARKET_SEGMENT_SHEET_ID() {
    return process.env.MARKET_SEGMENT_SHEET_ID;
  },
  get MARKET_SEGMENT_SHEET_GID() {
    return process.env.MARKET_SEGMENT_SHEET_GID;
  },
  get QUIZ_IMPORT_SHEET_GID() {
    return process.env.QUIZ_IMPORT_SHEET_GID;
  },
  get IDEA_GENERATOR_DATA_SHEET_ID() {
    return process.env.IDEA_GENERATOR_DATA_SHEET_ID;
  },
  get SOFTWARE_PROBLEM_SCORING_SHEET_GID() {
    return process.env.SOFTWARE_PROBLEM_SCORING_SHEET_GID;
  },
  get SOFTWARE_MARKET_SCORING_SHEET_GID() {
    return process.env.SOFTWARE_MARKET_SCORING_SHEET_GID;
  },
  get PHYSICAL_PROBLEM_SCORING_SHEET_GID() {
    return process.env.PHYSICAL_PROBLEM_SCORING_SHEET_GID;
  },
  get PHYSICAL_MARKET_SCORING_SHEET_GID() {
    return process.env.PHYSICAL_MARKET_SCORING_SHEET_GID;
  },
};
