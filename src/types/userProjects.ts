import mongoose from "mongoose";

export interface IUserProjects {
  userId: mongoose.Schema.Types.ObjectId;
  employeeId: mongoose.Schema.Types.ObjectId;
  projectId: mongoose.Schema.Types.ObjectId;
  status: number;
  startedAt: mongoose.Schema.Types.Date;
  completedAt: mongoose.Schema.Types.Date;
  endAt: mongoose.Schema.Types.Date;
}
