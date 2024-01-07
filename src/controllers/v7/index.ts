import WeeklyJourneyController from "@controllers/v7/weekly-journey";
import BusinessProfileController from "@controllers/v7/business-profile";
import UserController from "@controllers/v7/users";
import QuizController from "@controllers/v7/quiz";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("7.0.0", [
  WeeklyJourneyController,
  BusinessProfileController,
  UserController,
  QuizController,
]);

export default routeDict;
