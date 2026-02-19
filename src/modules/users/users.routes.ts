import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import * as usersController from "./users.controller.js";

const router = Router();

router.get("/me", authenticateToken, usersController.getMyProfile);
router.patch("/me", authenticateToken, usersController.updateMyProfile);
router.get("/:username", usersController.getUserProfile);

export default router;
