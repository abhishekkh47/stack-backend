import mongoose from "mongoose";

export interface IUserEmployees {
  userId: mongoose.Schema.Types.ObjectId;
  employeeId: mongoose.Schema.Types.ObjectId;
  currentLevel: number;
  unlockedLevel: number;
  currentRatings: IRatings[];
  hiredAt: mongoose.Schema.Types.Date;
  status: IStatus;
}

enum IStatus {
  UNLOCKED = 0,
  HIRED = 1,
  WORKING = 2,
  COMPLETED = 3,
}

interface IRatings {
  name: string;
  value: number;
}
