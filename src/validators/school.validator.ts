import { z } from "zod";

// ─── Add School Validator ─────────────────────────────────────────────────────

export const createSchoolSchema = z.object({
  name: z
    .string({ required_error: "name is required" })
    .trim()
    .min(2, "name must be at least 2 characters")
    .max(100, "name must not exceed 100 characters"),

  address: z
    .string({ required_error: "address is required" })
    .trim()
    .min(5, "address must be at least 5 characters")
    .max(255, "address must not exceed 255 characters"),

  latitude: z
    .number({ required_error: "latitude is required", invalid_type_error: "latitude must be a number" })
    .min(-90, "latitude must be between -90 and 90")
    .max(90, "latitude must be between -90 and 90"),

  longitude: z
    .number({ required_error: "longitude is required", invalid_type_error: "longitude must be a number" })
    .min(-180, "longitude must be between -180 and 180")
    .max(180, "longitude must be between -180 and 180")
});

// ─── List Schools Validator ───────────────────────────────────────────────────

export const listSchoolsSchema = z.object({
  latitude: z
    .string({ required_error: "latitude query param is required" })
    .transform(Number)
    .pipe(
      z.number()
        .min(-90, "latitude must be between -90 and 90")
        .max(90, "latitude must be between -90 and 90")
    ),

  longitude: z
    .string({ required_error: "longitude query param is required" })
    .transform(Number)
    .pipe(
      z.number()
        .min(-180, "longitude must be between -180 and 180")
        .max(180, "longitude must be between -180 and 180")
    )
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type ListSchoolsInput = z.infer<typeof listSchoolsSchema>;
