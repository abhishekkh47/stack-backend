import AuthController from "@controllers/v4/auth";
import QuizController from "@controllers/v4/quiz";
import UserController from "@controllers/v4/user";
import DripshopController from "@controllers/v4/dripshop";
import { getRouteDict } from "@app/utility";
import WebHookController from "@app/controllers/v4/webhook";
import BusinessProfileController from "@app/controllers/v4/business-profile";

const routeDict = getRouteDict("4.0.0", [
  AuthController,
  QuizController,
  UserController,
  DripshopController,
  WebHookController,
  BusinessProfileController,
]);

export default routeDict;
