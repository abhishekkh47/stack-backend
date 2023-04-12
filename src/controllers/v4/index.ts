import AuthController from "@controllers/v4/auth";
import QuizController from "@controllers/v4/quiz";
import UserController from "@controllers/v4/user";
import DripshopController from "@controllers/v4/dripshop";
import { getRouteDict } from "@app/utility";

const routeDict = getRouteDict("4.0.0", [
  AuthController,
  QuizController,
  UserController,
  DripshopController,
]);

export default routeDict;
