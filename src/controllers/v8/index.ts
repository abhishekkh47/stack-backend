import QuizController from "@controllers/v8/quiz";
import BusinessProfileController from "@controllers/v8/business-profile";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("8.0.0", [
  QuizController,
  BusinessProfileController,
]);

export default routeDict;
