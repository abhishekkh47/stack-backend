import AuthController from "./auth";
import UserController from "./user";
import QuizController from "./quiz";

import { getRouteDict } from "../../utility";

const routeDict = getRouteDict("3.0.0", [
  AuthController,
  UserController,
  QuizController,
]);

export default routeDict;
