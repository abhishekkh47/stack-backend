import DripshopController from "@controllers/v6/dripshop";
import UserController from "@controllers/v6/user";
import QuizController from "@controllers/v6/quiz";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("6.0.0", [
  DripshopController,
  UserController,
  QuizController,
]);

export default routeDict;
