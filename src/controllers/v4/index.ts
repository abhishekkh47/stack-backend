import AuthController from "./auth";
import QuizController from "./quiz";
import UserController from "./user";
import { getRouteDict } from "../../utility";

const routeDict = getRouteDict("4.0.0", [
  AuthController,
  QuizController,
  UserController,
]);

export default routeDict;
