import { Router } from "express";
import { addSchoolHandler, listSchoolsHandler } from "../controllers/school.controller";

const router = Router();

// POST /addSchool
router.post("/addSchool", addSchoolHandler);

// GET /listSchools?latitude=xx&longitude=yy
router.get("/listSchools", listSchoolsHandler);

export default router;
