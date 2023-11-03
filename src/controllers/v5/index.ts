import QuizController from "@controllers/v5/quiz";
import DripshopController from "@controllers/v5/dripshop";
import UserController from "@controllers/v5/user";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("5.0.0", [
  QuizController,
  DripshopController,
  UserController,
]);

export default routeDict;
