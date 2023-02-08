import AuthController from "./auth";
import QuizController from "./quiz";
import UserController from "./user";
import { getRouteDict } from "../../utility";

const routeDict = getRouteDict("3.0.0", [AuthController, UserController, QuizController]);

export default routeDict;
