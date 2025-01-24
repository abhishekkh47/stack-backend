export interface IDripshopItem {
  name: string;
  fuel: number;
  sizes: string[];
  description: string;
  image: string;
}

export interface IStreakRewards extends IDripshopItem {
  day: number;
  rewardType: ERewardType;
  reward: number | string;
  type: number;
}

export enum ERewardType {
  TOKEN = 1,
  CASH = 2,
  SCORE = 3,
  EMPLOYEE = 4,
  GIFT = 5,
}
