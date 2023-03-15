import AuthController from "./auth";
import QuizController from "./quiz";
import UserController from "./user";
import DripshopController from "./dripshop";
import { getRouteDict } from "../../utility";

const routeDict = getRouteDict("4.0.0", [
  AuthController,
  QuizController,
  UserController,
  DripshopController,
]);

export default routeDict;
