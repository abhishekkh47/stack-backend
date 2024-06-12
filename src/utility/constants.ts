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

export const GOOGLEAPIS = {
  placeApi: "https://maps.googleapis.com/maps/api/place/autocomplete/json",
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
  DRIP_SHOP_REDEEMED: "Drip Shop Redeemed",
  STREAK_GOAL_SUBMITTED: "Streak Goal Submitted",
  ACTION_COMPLETED: "Action Completed",
  PASSION_SUBMITTED: "Passion Submitted",
  SUB_PASSION_SUBMITTED: "Sub-Passion Submitted",
  PROBLEM_SUBMITTED: "Problem Submitted",
  BUSINESS_IDEA_SUBMITTED: "Business Idea Submitted",
  BUSINESS_IDEA_SELECTED: "Business Idea Selected",
  IDEA_VALIDATION_SUBMITTED: "Idea Validaton Submitted",
  TARGET_AUDIENCE_SUBMITTED: "Target Audience Submitted",
  BUSINESS_NAME_SUBMITTED: "Business Name Submitted",
  BUSINESS_LOGO_SUBMITTED: "Business Logo Submitted",
  TOP_COMPETITORS_SUBMITTED: "Top Competitors Submitted",
  BRAND_AESTHETIC_SUBMITTED: "Brand Aesthetic Submitted",
};

export const XP_POINTS = {
  CORRECT_ANSWER: 5,
  COMPLETED_QUIZ: 10,
  REFERRAL: 20,
  SIMULATION_QUIZ: 150,
};
export const COMPLETED_ACTION_REWARD = 100;
export const CORRECT_ANSWER_FUEL_POINTS = {
  QUIZ: 3,
  STORY: 10,
  SIMULATION: 10,
};
export const CHECKLIST_QUESTION_LENGTH = {
  QUIZ: 12,
  STORY: 4,
  SIMULATION: 5,
};
export const STREAK_LEVELS = {
  LEVEL1: { level: 1, maxValue: 3 },
  LEVEL2: { level: 2, maxValue: 7 },
  LEVEL3: { level: 3, maxValue: 14 },
  LEVEL4: { level: 4, maxValue: 30 },
  LEVEL5: { level: 5, maxValue: 50 },
  LEVEL6: { level: 6, maxValue: 100 },
};

export const DEFAULT_TIMEZONE = "America/New_York";
export const ALL_NULL_5_DAYS = [null, null, null, null, null];
export const FIVE_DAYS_TO_RESET = [1, null, null, null, null];
export const REFERRAL_SOURCES = [
  "store",
  "google",
  "news",
  "instagram",
  "tiktok",
  "linkedin",
  "youtube",
  "mouth",
  "website",
  "email",
  "schools_clubs",
  "linkedin",
  "social_media",
  "podcast",
];

export const DEFAULT_LIFE_COUNT = 5;
export const REFILL_INTERVAL = 4 * 3600 * 1000;
export const QUIZ_TYPE = {
  NORMAL: 1,
  SIMULATION: 2,
  STORY: 3,
};
export const STORY_QUESTION_TYPE = {
  DESCRIPTION: 1,
  QUESTION: 2,
};

export interface IPromptData {
  promptDescription?: string;
  prompt?: string;
  promptStyle?: string;
  imageName?: string;
  isNameOverride?: boolean;
}

export const SIMULATION_QUIZ_FUEL = 150;
export const REFILL_LIFE_FUEL = 300;
export const REFILL_HEARTS_ITEM_NAME = "Refill Hearts";

export const QUIZ_CATEGORIES_COLORS = [
  {
    colors: ["#56ABF9", "#191E96"],
    locations: [0.08, 0.9],
    angle: 45,
  },
  {
    colors: ["#9D85FF", "#5F25DB"],
    locations: [0.08, 0.9],
    angle: 45,
  },
  {
    colors: ["#78FFD6", "#007991"],
    locations: [0.08, 0.9],
    angle: 45,
  },
  {
    colors: ["#FDC830", "#F37335"],
    locations: [0.04, 1],
    angle: 87,
  },
  {
    colors: ["#E100FF", "#7F00FF"],
    locations: [0.08, 0.9],
    angle: 45,
  },
  {
    colors: ["#38C17F", "#1BB068", "#75EDA6"],
    locations: [0.0177, 0.09, 1],
    angle: 262,
  },
  {
    colors: ["#FF512F", "#DD2476"],
    locations: [0.09, 1],
    angle: 87,
  },
  {
    colors: ["#C770F0", "#B200F1"],
    locations: [0.08, 0.9],
    angle: 45,
  },
  {
    colors: ["#FF3352", "#7815F9"],
    locations: [0, 0.9],
    angle: 87,
  },
  {
    colors: ["#A5FECB", "#20BDFF", "#5433FF"],
    locations: [0.1, 0.5, 1],
    angle: 120,
  },
  {
    colors: ["#FF4B1F", "#FF4B1F"],
    locations: [1, 1],
    angle: 0,
  },
  {
    colors: ["#FF8048", "#9249F1"],
    locations: [0.08, 0.9],
    angle: 45,
  },
];

export const MAX_STREAK_FREEZE = 2;
export const STREAK_FREEZE_FUEL = 200;
export const STREAK_FREEZE_NAME = "Streak Freeze";
export const CHALLENGE_DURATION = 1; // 1 week
export const CHALLENGE_XP_INITIAL_GOAL = 1000;
export const CHALLENGE_XP_INCREMENT = 250;
export const CHALLENGE_FUEL_INITIAL_REWARD = 50;
export const CHALLENGE_FUEL_INCREMENT = 25;
export const RALLY_COMMUNITY_CHALLENGE_GOAL = 5;
export const CHALLENGE_TYPE = ["rally_community", "weekly_xp"];
export const COMMUNITY_CHALLENGE_CLAIM_STATUS = {
  PENDING: false,
  CLAIMED: true,
};
export const RALLY_COMMUNITY_REWARD = "Inspire Pack";
export const WEEKLY_CHALLENGE_REWARD_LIST = [
  {
    xpGoal: 1000,
    fuel: 50,
  },
  {
    xpGoal: 1250,
    fuel: 75,
  },
  {
    xpGoal: 1500,
    fuel: 100,
  },
  {
    xpGoal: 1750,
    fuel: 150,
  },
  {
    xpGoal: 2000,
    fuel: 175,
  },
  {
    xpGoal: 2250,
    fuel: 200,
  },
];

export const PROMPT_STYLE = [
  "in the style of 3d vector realistic animation, soft lighting --v 6",
  "in the style of pixel art, idyllic --v 6",
  "in the style of cyberpunk, vibrant futurism, photo-realistic --v 6",
  "in the style of photo-realistic, soft lighting, studio photography --v 6",
];

export const WEEKLY_REWARD_ACTION_NUM = 3;

export const BUSINESS_PREFERENCE = {
  PASSION: "PASSION",
  ASPECT: "ASPECT",
  PROBLEM: "PROBLEM",
};
export const SYSTEM = "system";
export const USER = "user";
export const SUGGESTION_FORMAT = {
  TEXT: "text",
  IMAGE: "image",
};

export const INVALID_DESCRIPTION_ERROR =
  "Oops! It seems like the business idea you entered is invalid. Please check your input and try again.";
export const MAXIMIZE_BUSINESS_IMAGES = [
  "maximize_1.png",
  "maximize_2.png",
  "maximize_3.png",
];

export const BUSINESS_ACTIONS = {
  companyName: "COMPANY_NAME",
  companyLogo: "COMPANY_LOGO",
  targetAudience: "TARGET_AUDIENCE",
  competitors: "COMPETITORS",
  keyDifferentiator: "KEY_DIFFERENTIATOR",
  xForY: "X_FOR_Y",
  headline: "HEADLINE",
  valueCreators: "VALUE_CREATORS",
  colorsAndAesthetic: "COLORS_AND_AESTHETIC",
  callToAction: "CALL_TO_ACTION",
  linkYourBlog: "BLOG_TOPIC",
  linkYourWebsite: "WEBSITE_LINK",
};

export const WEEKLY_JOURNEY_ACTION_DETAILS = {
  companyName: {
    key: "companyName",
    title: "Creating Your Business Name",
    steps: [
      "Brainstorming brand name associations",
      "Using best practice naming principles",
      "Checking domain name availability",
    ],
    hoursSaved: 33,
    week: 1,
    day: 1,
    placeHolderText: "Enter name...",
    isMultiLine: false,
    maxCharLimit: 15,
  },
  companyLogo: {
    key: "companyLogo",
    title: "Creating Your Logo",
    steps: [
      "Gathering brand identity inspiration",
      "Sketching and refining design concepts",
      "Finalizing logo design options",
    ],
    actionName: "Your Logo",
    hoursSaved: 51,
    week: 1,
    day: 2,
    placeHolderText: null,
    isMultiLine: false,
    maxCharLimit: 0,
  },
  targetAudience: {
    key: "targetAudience",
    title: "Creating Your Target Audience",
    steps: [
      "Identifying demographic traits",
      "Understanding psychographic behaviors",
      "Defining your ideal customer profile",
    ],
    actionName: "Your Target Audience",
    hoursSaved: 59,
    week: 1,
    day: 3,
    placeHolderText: "Enter description...",
    isMultiLine: true,
    maxCharLimit: 280,
  },
  competitors: {
    key: "competitors",
    title: "Recognizing Your Top-5 Competitors",
    steps: [
      "Identifying key players in your market",
      "Analyzing strengths and weaknesses",
      "Ranking based on relevance and impact",
    ],
    actionName: "Your Top-5 Competitors",
    hoursSaved: 68,
    week: 1,
    day: 4,
    placeHolderText: "Enter description...",
    isMultiLine: true,
    maxCharLimit: 280,
  },
  keyDifferentiator: {
    key: "keyDifferentiator",
    title: "Defining Your Key Differentiator",
    steps: [
      "Analyzing your unique business features",
      "Researching market whitespace",
      "Crafting a compelling value proposition",
    ],
    actionName: "Your Key Differentiator",
    hoursSaved: 82,
    week: 1,
    day: 5,
    placeHolderText: "Enter description...",
    isMultiLine: true,
    maxCharLimit: 280,
  },
  xForY: {
    key: "xForY",
    title: "Crafting Your X for Y pitch",
    steps: [
      "Selecting well known companies",
      "Connecting your product or service",
      "Refining the pitch for clarity and impact",
    ],
    actionName: "Your X for Y pitch",
    hoursSaved: 92,
    week: 1,
    day: 6,
    placeHolderText: "Enter pitch...",
    isMultiLine: false,
    maxCharLimit: 40,
  },
};

export const IMAGE_ACTIONS = ["companyLogo"];
export const REQUIRE_COMPANY_NAME = ["linkYourWebsite", "colorsAndAesthetic"];
export const IS_RETRY = {
  TRUE: "true",
  FALSE: "false",
};
export const DEDUCT_RETRY_FUEL = -200;
export const HOURS_SAVED_BY_IDEA_GENERATOR = 28;
export const BACKUP_LOGOS = [
  "https://s3.amazonaws.com/stack-business-information/backupLogos/BackupBusinessLogo-1.png",
  "https://s3.amazonaws.com/stack-business-information/backupLogos/BackupBusinessLogo-2.png",
  "https://s3.amazonaws.com/stack-business-information/backupLogos/BackupBusinessLogo-3.png",
  "https://s3.amazonaws.com/stack-business-information/backupLogos/BackupBusinessLogo-4.png",
];
export const PRO_SUBSCRIPTION_PRICE = {
  jetson_9999_1y_1w0: 99.99,
  jetson_1299_1m_1w0: 12.49,
};
export const COACH_REQUIREMENTS = {
  goodAt: {
    order: 1,
    title: "What do you feel you’re really good at?",
    options: [
      { id: 1, value: "Leading a group or community of peers" },
      {
        id: 2,
        value: "Technical skills including software engineering & coding",
      },
      { id: 3, value: "Graphic design and making things look high quality" },
      {
        id: 4,
        value:
          "Getting peers interested and excited about products that I like",
      },
      { id: 5, value: "Other" },
    ],
  },
  needHelpIn: {
    order: 2,
    title: "Where do you feel you need the most support?",
    options: [
      {
        id: 1,
        heading: "Idea Validation",
        description:
          "I have a business idea but I want to make sure there’s demand.",
        message:
          "Excited to help you validate your idea. What's the core concept of your idea, and who do you envision as your target audience?",
      },
      {
        id: 2,
        heading: "No Code Solutions",
        description:
          "I’m not a technical person but I want to build a prototype.",
        message:
          "Interested in no-code solutions? What features are you looking to implement?",
      },
      {
        id: 3,
        heading: "Developing MVP",
        description: "I believe in my idea but I need to bring it to life.",
        message:
          "Excited to help you with developing MVP. What's your vision for the product?",
      },
      {
        id: 4,
        heading: "Marketing Strategy",
        description: "I have a version of my product ready and I want to grow.",
        message:
          "Excited to help you craft an effective marketing strategy. What are your main goals for your marketing efforts, and who is your idea customer?",
      },
      {
        id: 5,
        heading: "Other",
        message:
          "Excited to help you with any challenge you're facing. What is on your mind?",
      },
    ],
  },
  coachingStyle: {
    order: 3,
    title: "Which coaching style do you like better?",
    options: [
      { id: 1, value: "Motivational" },
      { id: 2, value: "Direct" },
      { id: 3, value: "Calm" },
      { id: 4, value: "Upbeat" },
      { id: 5, value: "Collaborative" },
      { id: 6, value: "Other" },
    ],
  },
  findPerfectCoach: {
    order: 4,
    title: "Finding your perfect Coach",
    options: [
      { id: 1, value: "Analyzing your coaching needs" },
      { id: 2, value: "Searching our database of coaches" },
      { id: 3, value: "Matching you with the perfect coach" },
    ],
  },
};
export const THINGS_TO_TALK_ABOUT = [
  "💡 How do you generate new ideas?",
  "🤔 What makes a business unique?",
  "👍 How to validate your ideas?",
  "🛠 How to build a product?",
  "🔊 How to market your business?",
  "👥 Who are your customers?",
  "📈 How to get your first 100 customers?",
  "🎯 What should you focus on first?",
  "💰 How will you fund your business?",
];
export const MENTORS = ["natalieYoung", "willRush"];
export const CATEGORY_COUNT = 12;
export const LEVEL_COUNT = 5;
export const LEVEL_QUIZ_COUNT = 4;
export const START_FROM_SCRATCH = {
  _id: "1",
  order: 6,
  title: "Start From Scratch",
  image: "start_from_scratch.webp",
  categories: [],
};
export const PERFECT_IDEA = {
  _id: "1",
  title: "Find Your Perfect Idea",
  description:
    "Use Jetson AI to find the unique idea that excites you or input your own idea",
  order: 0,
};
export const IMPORT_SCRIPT = "import";
export interface ICharacterImageData {
  imageName?: string;
  imageUrl?: string;
}

export const BUSINESS_TYPE = {
  1: "SYSTEM_PHYSICAL_PRODUCT", // E-Commerce
  2: "SYSTEM_SOFTWARE_TECHNOLOGY",
  3: "SYSTEM_CONTENT",
};

export const AI_TOOLBOX_IMAGES = {
  description: "light_bulb.webp",
  ideaValidation: "magnifire.webp",
  targetAudience: "direct_hit.webp",
  companyName: "speech_balloon.webp",
  companyLogo: "sparkles.webp",
  competitors: "racing_car.webp",
  colorsAndAesthetic: "artist_palette.webp",
};

export const PRODUCT_TYPE = {
  Physical: 1,
  Software: 2,
  Content: 3,
};

export const AI_TOOLS_ANALYTICS = {
  ideaValidation: "IDEA_VALIDATION_SUBMITTED",
  targetAudience: "TARGET_AUDIENCE_SUBMITTED",
  companyName: "BUSINESS_NAME_SUBMITTED",
  companyLogo: "BUSINESS_LOGO_SUBMITTED",
  competitors: "TOP_COMPETITORS_SUBMITTED",
  colorsAndAesthetic: "BRAND_AESTHETIC_SUBMITTED",
};

export const INITIAL_TUTORIAL_STATUS = {
  quiz: false,
  caseStudy: false,
  simulation: false,
  aiTools: false,
  ideaGenerator: false,
  mentorship: false,
  aiToolVisited: false,
  mentorshipVisited: false,
};

export const TUTORIAL_LOOKUP = {
  quiz: { quiz: true },
  caseStudy: { quiz: true, caseStudy: true },
  simulation: { quiz: true, caseStudy: true, simulation: true },
  aiTools: { aiTools: true },
  ideaGenerator: { aiTools: true, ideaGenerator: true },
  mentorship: { mentorship: true },
  aiToolVisited: { aiToolVisited: true },
  mentorshipVisited: { mentorshipVisited: true },
};
