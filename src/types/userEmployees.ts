import mongoose from "mongoose";

export interface IUserEmployees {
  userId: mongoose.Schema.Types.ObjectId;
  employeeId: mongoose.Schema.Types.ObjectId;
  currentLevel: number;
  unlockedLevel: number;
  currentRating1: number;
  currentRating2: number;
  currentRating3: number;
  hiredAt: string;
  status: IStatus;
}

enum IStatus {
  UNLOCKED = 0,
  HIRED = 1,
  WORKING = 2,
  COMPLETED = 3,
}
