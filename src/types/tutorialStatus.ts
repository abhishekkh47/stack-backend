import mongoose from "mongoose";
export interface ITutorialStatus {
  userId: mongoose.Schema.Types.ObjectId;
  quiz: boolean;
  caseStudy: boolean;
  simulation: boolean;
  aiTools: boolean;
  ideaGenerator: boolean;
  mentorship: boolean;
  aiToolVisited: boolean;
  mentorshipVisited: boolean;
  saveIdea: boolean;
  validateIdea: boolean;
}
