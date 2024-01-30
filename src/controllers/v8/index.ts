import BusinessProfileController from "@controllers/v8/business-profile";
import QuizController from "@controllers/v7/quiz";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("7.0.0", [
  BusinessProfileController,
  QuizController,
]);

export default routeDict;
