import AuthController from "./auth";
import QuizController from "./quiz";
import UserController from "./user";
import TradingController from "./trading"
import { getRouteDict } from "../../utility";

const routeDict = getRouteDict("3.0.0", [
  AuthController,
  UserController,
  QuizController,
  TradingController
]);

export default routeDict;
