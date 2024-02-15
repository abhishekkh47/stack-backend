import QuizController from "@controllers/v8/quiz";
import WeeklyJourneyController from "@controllers/v8/weekly-journey";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("8.0.0", [
  QuizController,
  WeeklyJourneyController,
]);

export default routeDict;
