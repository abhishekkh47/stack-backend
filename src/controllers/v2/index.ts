import AuthController from "@controllers/v2/auth";
import UserController from "@controllers/v2/user";
import TradingController from "@controllers/v2/trading";
import QuizController from "@controllers/v2/quiz";
import DripshopController from "@controllers/v2/dripshop";
import CryptoController from "@controllers/v2/crypto";

import { getRouteDict } from "@app/utility";

const routeDict = getRouteDict("2.0.0", [
  AuthController,
  UserController,
  TradingController,
  QuizController,
  DripshopController,
  CryptoController,
]);

export default routeDict;
