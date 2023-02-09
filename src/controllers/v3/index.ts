import AuthController from "./auth";
import QuizController from "./quiz";

import { getRouteDict } from "../../utility";

const routeDict = getRouteDict("3.0.0", [AuthController, QuizController]);

export default routeDict;
