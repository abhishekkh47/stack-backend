import AuthController from "./auth";
import UserController from "./user";

import { getRouteDict } from "../../utility";

const routeDict = getRouteDict("3.0.0", [AuthController, UserController]);

export default routeDict;
