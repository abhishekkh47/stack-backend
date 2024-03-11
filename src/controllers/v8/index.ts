import QuizController from "@controllers/v8/quiz";
import CoachController from "@app/controllers/v8/coach";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("8.0.0", [QuizController, CoachController]);

export default routeDict;
