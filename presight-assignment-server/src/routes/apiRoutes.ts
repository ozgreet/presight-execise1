import { Router } from "express";
import { insightsController } from "../controllers/insightsController.js";
import { facetsController, usersController } from "../controllers/usersController.js";
import { validate } from "../middleware/validate.js";
import { insightsQuerySchema } from "../schemas/insightsQuery.js";
import { facetsQuerySchema, usersListQuerySchema } from "../schemas/usersQuery.js";

export const apiRoutes = Router();

apiRoutes.get("/users", validate({ query: usersListQuerySchema }), usersController.list);
apiRoutes.get("/facets", validate({ query: facetsQuerySchema }), facetsController.list);
apiRoutes.get("/insights", validate({ query: insightsQuerySchema }), insightsController.overview);
