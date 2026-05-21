import { Request, Response } from "express";
import { createSchoolSchema, listSchoolsSchema } from "../validators/school.validator";
import { addSchool, listSchoolsSortedByDistance } from "../services/school.service";
import { ApiResponse, School, SchoolWithDistance } from "../types/school.types";

// ─── POST /addSchool ──────────────────────────────────────────────────────────

export const addSchoolHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  // 1. Validate
  const parsed = createSchoolSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => e.message);
    const response: ApiResponse<null> = {
      success: false,
      message: "Validation failed",
      errors
    };
    res.status(400).json(response);
    return;
  }

  // 2. Insert
  const insertId = await addSchool(parsed.data);

  const response: ApiResponse<{ id: number }> = {
    success: true,
    message: "School added successfully",
    data: { id: insertId }
  };

  res.status(201).json(response);
};

// ─── GET /listSchools ─────────────────────────────────────────────────────────

export const listSchoolsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  // 1. Validate query params
  const parsed = listSchoolsSchema.safeParse(req.query);

  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => e.message);
    const response: ApiResponse<null> = {
      success: false,
      message: "Validation failed",
      errors
    };
    res.status(400).json(response);
    return;
  }

  // 2. Fetch + sort
  const { latitude, longitude } = parsed.data;
  const schools = await listSchoolsSortedByDistance(latitude, longitude);

  const response: ApiResponse<SchoolWithDistance[]> = {
    success: true,
    message: `Found ${schools.length} school(s), sorted by proximity`,
    data: schools
  };

  res.status(200).json(response);
};
