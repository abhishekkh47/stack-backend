import AuthController from "./auth";
import QuizController from "./quiz";
import UserController from "./user";
import TradingController from "./trading";
import WebHookController from "./webhook";
import { getRouteDict } from "../../utility";

const routeDict = getRouteDict("3.0.0", [
  AuthController,
  UserController,
  QuizController,
  TradingController,
  WebHookController,
]);

export default routeDict;
