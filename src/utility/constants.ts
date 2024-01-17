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
};

export const XP_POINTS = {
  CORRECT_ANSWER: 5,
  COMPLETED_QUIZ: 10,
  REFERRAL: 20,
  SIMULATION_QUIZ: 50,
};
export const COMPLETED_ACTION_REWARD = 100;

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

export const DEFAULT_LIFE_COUNT = 3;
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

export const SIMULATION_QUIZ_FUEL = 50;
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

export const SYSTEM_DATA = `"“dataset1” below contains a list of business descriptions, the corresponding category of that business, the problem that business solves as well as an indication of how many potential customer that business may have.
I want you to write a business description as well as an indication of how many potential customer that business may have  that closely follows the format of the business descriptions in “dataset1"".  These are all one sentence, short but unique businesses.
You will write three different business descriptions and potential customers for the category and problem provided by user prompt.

The format of the three business descriptions and potential customer should be an array as follows:
[{"businessDescription": [insert business description],"opportunityHighlight": [insert potential customers datapoint]]

dataset1: 
A gamified and story-driven application teaching coding in Python, HTML, CSS, or JavaScript.        Online Gaming        Balancing gaming with other life responsibilities.        Over 6 million individuals learn the coding languages Python, HTML, CSS, or JavaScript each year.
An AI shopping assistant integrated into e-commerce platforms to personalize customer shopping experiences.        Sizing        Difficulty finding consistent sizing across brands.        Approximately 1.8 billion people globally shop online.
A LinkedIn post generator optimizing posts for audience engagement and personal branding.        Social Media        Managing personal reputation or brand.        Over 310 million monthly active users are on LinkedIn.
A mobile app providing theft protection, insurance, roadside assistance, and on-demand repairs for e-bike owners.        Outdoor Adventure/Sports        Experiencing equipment or gear issues.        More than 5 million e-bikes were sold globally in 2023.
A digital Bitcoin art marketplace leveraging smart contracts and the Lightning Network for digital art asset exchanges.        Cryptocurrency        Accessing and analyzing public blockchain data.        The digital art market has over 1 million active buyers.
A virtual poker app designed for friend groups, featuring chat and video interfaces for a social gaming experience.        Online Gaming        Building a team in cooperative games.        An estimated 100 million people worldwide play poker.
A text-to-audio app utilizing AI to customize human-like emotions in audio content.        Making Music        Learning music production software.        There are 400 million audiobook listeners globally.
A travel credit card tailored to the unique needs of Generation Z.        Luxury Travel        Personalized itinerary planning.        67 million Generation Z individuals are in the U.S.
A brokerage firm enabling users to build custom ETFs based on their investment preferences and risk profile.        Trading Stocks        Experiencing volatility due to inadequate risk management.        56% of Americans own stocks.
A voice-to-action AI agent acting as a personal assistant, managing administrative tasks and life organization.        Financial Literacy        Managing credit and debt.        110 million users in the U.S. utilize virtual assistants.
A fintech platform allowing Mexican nationals to earn US Dollars and pay in Mexican Pesos.        Financial Literacy        Understanding cryptocurrency and digital assets.        Over 1.5 million Mexican nationals currently live and work in the U.S.
A marketplace streamlining the acquisition and transaction process of small businesses.        Trading Stocks        Losing money by following online communities/posts.        Annually, around 2.5 million small businesses are sold in the U.S.
A marketplace for rare coins and precious metals, using auction data and historical pricing for accurate valuations.        Cryptocurrency        Volatility in web3 assets like NFTs.        There are over 5 million active collectors of coins and precious metals in the U.S.
An AI-driven shopping platform where users can find clothing items based on inputted styles or looks.        Fast Fashion        Identifying sustainably made products.        390 million people globally prioritize sustainability as their number one driver for purchasing clothing.
An AI-driven video game designer generating new maps, terrains, and resources for unpredictable gameplay.        Online Gaming        Lack of innovation in majority of games.        Popular video games like Fortnite and Call of Duty have over 400 million users.
A platform identifying the best plane ticket deals using exclusively credit card points.        Budget Travel        Finding affordable eating options.        18.9 million credit card holders redeemed points for airplane miles in 2023.
An AI-driven news content writer focusing on niche current events for cost-effective article creation.        Writing        Finding inspiration.        There are approximately 1.5 million digital news subscribers in the U.S..
An app leveraging AI to create and share photos of users in imaginary situations on social media.        Social Media        Avoiding content or creation burnout.        159 million Americans use photo editing apps each year.
An AI-driven math tutor incorporating speech, text, and image recognition for personalized learning.        Education        Finding effective learning strategies.        10.2 million students use math tutoring services each year.
An AI-driven marketplace offering back-office tasks like lead generation or financial modeling at competitive prices.        Financial Literacy        Grasping financial regulation and legal practices.        Approx. 8 million small businesses use lead generation services each year.
An AI and gamified nutrition coach allowing meal logging through photo recognition.        Health & Nutrition        Creating balanced and nutritious meals.        There are over 100 million health app users in the U.S..
An AI-driven video animation creator transforming text inputs into short-form animations.        Videography        Time-consuming editing process.        Over 40 million creators worldwide use video editing software.
A multiplayer development platform providing game servers, matchmaking, and DDoS mitigation.        Online Gaming        Ensuring fair play and dealing with cheaters.        The global eSports audience is 474 million people.
An AI search engine for academic research, answering questions with included citations.        Education        Accessing diverse educational resources.        38 million college students have expressed a need for more diverse educational resources.
A mobile application optimizing app usage time for mental health benefits.        Mental Health        Managing screen time effectively.        An estimated 200 million health app users are interested in apps for managing screen time.
An AI-driven comic creator instantly generating comics from text inputs.        Drawing/Painting        Overcoming creative block.        15 million digital comics readers might seek tools or services to overcome creative block.
A marketplace for real-life events, using AI to optimize and personalize event suggestions.        Festivals/Concerts        Locating concerts and festivals.        300 million active users on social event discovery platforms are likely to actively seek out concerts and festivals.
A mobile app enforcing habits through monetary wagers.        Mental Health        Building positive habits and routines.        Approximately 380 million health app users specifically focus on building positive habits and routines.
A social app for creators, educators, and experts to launch video courses and provide AI-assisted coaching.        Education        Accessing diverse educational resources.        50 million students and academic researchers may actively seek diverse educational resources online.
A marketplace offering curated real-life guides and adventures globally for trip planning.        Adventure        Difficulty finding travel buddies for niche adventures.        70 million international tourists might be interested in finding travel companions for niche adventures.
A text-to-video language model converting text inputs into visually rich short-form videos.        Videography        Generating engaging and original content ideas.        About 70 million students and professionals could be interested in tools for generating original content ideas.
A self-custody bitcoin app catering to users wary of crypto exchanges and hardware wallets.        Cryptocurrency        Security breaches in accounts/wallets.        20 million cryptocurrency users may be particularly concerned with security and interested in self-custody solutions.
A Fintech platform enabling investment in company earnings, revenues, regions, and segments without buying stocks.        Trading Stocks        Incurring losses from borrowing/margin trading.        14.5 million Americans who invest in the stock market might engage in higher-risk activities like borrowing or margin trading.
A digital wealth management platform offering access to actively managed alternative investment portfolios.        Financial Literacy        Learning about stock trading and investing.        Over 19.6 million high-net-worth individuals represent a specific market for advanced stock trading and investment learning resources.
An all-in-one fintech platform providing bank accounts, transfers, credit cards, and financial data for e-commerce businesses.        Financial Literacy        Optimizing financial infrastructure.        More than 3.6 million small to medium-sized e-commerce businesses could benefit from financial infrastructure optimization.
A reseller marketplace for second-hand fashion using live streaming and video marketing.        Fast Fashion        Influencer-led promotions and follower mentality.        Approximately 24 million people influenced by social media promotions might be interested in a reseller fashion marketplace.
An AI-driven picture-to-purchase e-commerce tool converting online images into purchase links.        Online Shopping        Finding quality products at affordable prices.        Around 214 million online shoppers are likely seeking AI-driven tools to find quality products at competitive prices.
An accelerator program focused on Roblox games.        Online Gaming        Building a team in cooperative games.        Over 40.4 million active Roblox users are interested in cooperative gameplay and team building.
An AI-driven dating matchmaker emphasizing depth by limiting engagement to one user at a time.        Online Dating        Overwhelmed by choices.        With 323 million people using dating apps, about 48.45 million might seek services that limit choices to enhance the dating experience.
A virtual reality basketball game where players team up to defeat non-player characters.        Virtual Reality Games        Limited social interaction in VR gaming.        In the virtual reality gaming market of 171 million users, around 17.1 million might seek games offering more social interaction.
A food manufacturer specializing in sustainable seafood alternatives using plant protein and biotechnology.        Conservation/Environmentalism        Habitat destruction and fragmentation.        The global plant-based food market includes an estimated 15 million consumers highly concerned with habitat destruction and fragmentation.
A cat food manufacturer incorporating plant protein for more sustainable animal food.        Conservation/Environmentalism        Conflict with local communities or businesses.        Over 4.2 million U.S. households owning cats could be a market for sustainable pet food addressing conflicts with local communities or businesses.
An AI-driven website builder converting text prompts into functional landing pages and websites.        Technology        Navigating website design and development.        Approximately 180 million small business owners might actively seek AI-driven website builders.
A commission-free sports betting exchange for bets against peers rather than the house.        Fantasy/Betting        Keeping fantasy league participation within budget.        The global online sports betting market includes about 3 million users interested in a commission-free betting exchange for fantasy league management.
A group rideshare app offering on-demand 15-passenger van bookings for consumers and businesses.        Transportation        Finding affordable and reliable travel options.        Among the 36 million users of ridesharing apps in the U.S., about 7.2 million might be looking for group rideshare services.
An AI-driven fitness app providing personalized coaching for runners.        Fitness/Working Out        Developing a personalized nutrition plan.        About 22 million fitness app users in the U.S., many of whom are runners, might specifically seek AI-driven apps for personalized nutrition plans.
A fintech app for contractors and freelancers to transact using an exclusive digital currency.        Cryptocurrency        Identifying scams and fraud schemes.        Over 5.7 million freelancers in the U.S. could potentially use a fintech app for transactions in a digital currency, focusing on avoiding scams and fraud schemes.
A mobile app assisting consumers with low credit scores in credit recovery through personalized plans.        Financial Literacy        Managing credit and debt.        Approximately 68 million Americans with poor or fair credit scores could benefit from credit recovery mobile apps.
A fintech mobile app automating savings and investing them in gold.        Budgeting/Saving        Setting and achieving financial goals.        The personal finance app market includes around 30 million users globally interested in apps that automate savings and investments in gold."`;
