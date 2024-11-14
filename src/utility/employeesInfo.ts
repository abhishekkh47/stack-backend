export const EMPLOYEES = [
  {
    _id: 1,
    order: 1,
    name: "Madison",
    icon: "rocket.png",
    title: "Growth Intern",
    image: "Madison-Employee.webp",
    price: 100,
    workTime: 1,
    bio: "Madison is an ambitious local college student whose goal is to be a marketing leader one day. For now she is especially adept at spotting trends on social media and capturing content.",
    unlockTrigger: "string",
    /**
     * 0 = ALL
     * 1 = PRO
     */
    userType: 1,
    ratings: ["Data Analysis", "Social Media", "Brand Growth"],
  },
];

export const EMPLOYEE_LEVELS = [
  {
    _id: 1,
    employeeId: 1,
    level: 1,
    title: "Growth Intern",
    rating: [
      { name: "Data Analysis", value: 8 },
      { name: "Social Media", value: 14 },
      { name: "Brand Growth", value: 30 },
    ],
    promotionTrigger: "string",
    promotionCost: 100,
  },
  {
    _id: 2,
    employeeId: 1,
    level: 2,
    title: "string",
    rating: [
      { name: "Data Analysis", value: 8 },
      { name: "Social Media", value: 14 },
      { name: "Brand Growth", value: 30 },
    ],
    promotionTrigger: "string",
    promotionCost: 0,
  },
  {
    _id: 3,
    employeeId: 1,
    level: 3,
    title: "string",
    rating: [
      { name: "Data Analysis", value: 8 },
      { name: "Social Media", value: 14 },
      { name: "Brand Growth", value: 30 },
    ],
    promotionTrigger: "string",
    promotionCost: 0,
  },
];

export const EMPLOYEE_PROJECTS = [
  {
    _id: 1,
    employeeLevelId: 1,
    title: "Publish an SEO-driven Blog",
    description:
      "Madison will write and publish an SEO-driven blog aimed at increasing organic traffic and boosting search engine visibility.",
    rewards: [
      {
        probability: 4,
        image: "O10001.webp",
        description: "",
        rating: 2,
        cash: 50,
      },
    ],
  },
  {
    _id: 2,
    employeeLevelId: 2,
    title: "Table at Local Event",
    description:
      "Madison will table at a local event with a booth and QR codes to drive attendees to the app.",
    rewards: [
      {
        probability: 4,
        image: "O10001.webp",
        description:
          "An event attendee with 500K IG followers posts about Madison/the app bringing in 10K new users.",
        rating: 2,
        cash: 50,
      },
    ],
  },
  {
    _id: 3,
    employeeLevelId: 3,
    title: "Post a Video to TikTok",
    description:
      "Madison will post a video to TikTok to boost brand awareness and engage potential users.",
    rewards: [
      {
        probability: 4,
        image: "O10001.webp",
        description:
          "Madison's TikTok video goes viral reaching 1M views and attracting 20K new app downloads in 3 days.",
        rating: 2,
        cash: 50,
      },
    ],
  },
];

export const USER_EMPLOYEES = [
  {
    _id: 1,
    user_id: "",
    employeeId: 1,
    currentLevel: 1,
    levelUnlocked: 1,
    rating1: 0,
    rating2: 0,
    rating3: 0,
    hired_At: new Date(),
    status: 1,
  },
];
