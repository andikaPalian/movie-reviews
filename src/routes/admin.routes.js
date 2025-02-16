import express from 'express';
import { loginAdmin, registerAdmin } from '../controllers/admin.controllers.js';
import { adminValidation, hashRole } from '../middlewares/adminValidation.js';

const adminRouter = express.Router();

adminRouter.post("/register", adminValidation, hashRole(["super_admin"]), registerAdmin);
adminRouter.post("/login", loginAdmin);

export default adminRouter;