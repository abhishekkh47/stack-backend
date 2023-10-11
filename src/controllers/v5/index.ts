import QuizController from "@controllers/v5/quiz";
import DripshopController from "@controllers/v5/dripshop";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("5.0.0", [QuizController, DripshopController]);

export default routeDict;
