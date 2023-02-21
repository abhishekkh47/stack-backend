import AuthController from "./auth";
import QuizController from "./quiz";
import VideoController from "./video";
import HelpCenterController from "./help-center";
import TradingController from "./trading";
import CryptoController from "./crypto";
import UserController from "./user";
import CMSController from "./cms";
import WebHookController from "./webhook";
import ScriptController from "./script";
import DripshopController from "./dripshop";
import { getRouteDict } from "../../utility";

const routeDict = getRouteDict('1.0.0', [
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
])

export default routeDict;
