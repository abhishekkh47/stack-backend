import mongoose from "mongoose";

export interface IEmployees {
  name: string;
  icon: string;
  title: string;
  image: string;
  price: number;
  workTime: number;
  bio: string;
  unlockTrigger: string;
  userType: number;
  ratings: string[];
  order: number;
}

export interface IEmployeeLevels {
  employeeId: mongoose.Schema.Types.ObjectId;
  level: number;
  title: string;
  ratingValues: IRatings[];
  promotionTrigger: string;
  promotionCost: number;
}

interface IRatings {
  name: string;
  value: string;
}
export interface IEmployeeProjects {
  employeeLevelId: mongoose.Schema.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  rewards: IProjectRewards[];
}

interface IProjectRewards {
  probability: mongoose.Types.Decimal128;
  image: string;
  description: string;
  rating: number;
  cash: number;
}
