import AuthController from "@controllers/v1/auth";
import QuizController from "@controllers/v1/quiz";
import VideoController from "@controllers/v1/video";
import HelpCenterController from "@controllers/v1/help-center";
import TradingController from "@controllers/v1/trading";
import CryptoController from "@controllers/v1/crypto";
import UserController from "@controllers/v1/user";
import CMSController from "@controllers/v1/cms";
import WebHookController from "@controllers/v1/webhook";
import ScriptController from "@controllers/v1/script";
import DripshopController from "@controllers/v1/dripshop";
import { getRouteDict } from "@app/utility";

const routeDict = getRouteDict("1.0.0", [
  AuthController,
  QuizController,
  VideoController,
  HelpCenterController,
  TradingController,
  CryptoController,
  UserController,
  CMSController,
  WebHookController,
  DripshopController,
  // ScriptController,
]);

export default routeDict;
