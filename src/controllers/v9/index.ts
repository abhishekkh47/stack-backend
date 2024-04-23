import BusinessProfileController from "@controllers/v9/business-profile";
import CoachController from "@app/controllers/v9/coach";
import ChecklistJourneyController from "@app/controllers/v9/checklist-journey";
import QuizController from "@controllers/v9/quiz";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("9.0.0", [
  BusinessProfileController,
  CoachController,
  ChecklistJourneyController,
  QuizController,
]);

export default routeDict;
