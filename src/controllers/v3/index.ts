import AuthController from "@controllers/v3/auth";
import QuizController from "@controllers/v3/quiz";
import UserController from "@controllers/v3/user";
import TradingController from "@controllers/v3/trading";
import WebHookController from "@controllers/v3/webhook";
import { getRouteDict } from "@app/utility";

const routeDict = getRouteDict("3.0.0", [
  AuthController,
  UserController,
  QuizController,
  TradingController,
  WebHookController,
]);

export default routeDict;
