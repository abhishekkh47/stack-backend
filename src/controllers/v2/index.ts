import AuthController from "./auth";
import UserController from "./user";
import TradingController from "./trading";
import QuizController from "./quiz";
import DripshopController from "./dripshop";
import CryptoController from "./crypto";

import { getRouteDict } from "../../utility";

const routeDict = getRouteDict("2.0.0", [
  AuthController,
  UserController,
  TradingController,
  QuizController,
  DripshopController,
  CryptoController,
]);

export default routeDict;
