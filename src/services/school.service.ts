import pool from "../config/db";
import { CreateSchoolDTO, School, SchoolWithDistance } from "../types/school.types";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// ─── Haversine Distance Formula ───────────────────────────────────────────────
// Returns distance in kilometers between two lat/lng coordinates.
// This is the standard great-circle distance calculation.

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const EARTH_RADIUS_KM = 6371;

  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return parseFloat((EARTH_RADIUS_KM * c).toFixed(2));
};

// ─── Add School ───────────────────────────────────────────────────────────────

export const addSchool = async (data: CreateSchoolDTO): Promise<number> => {
  const { name, address, latitude, longitude } = data;

  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
    [name, address, latitude, longitude]
  );

  return result.insertId;
};

// ─── List Schools (sorted by proximity) ──────────────────────────────────────

export const listSchoolsSortedByDistance = async (
  userLat: number,
  userLon: number
): Promise<SchoolWithDistance[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, name, address, latitude, longitude FROM schools"
  );

  const schools = rows as School[];

  const schoolsWithDistance: SchoolWithDistance[] = schools.map((school) => ({
    ...school,
    distance_km: haversineDistance(userLat, userLon, school.latitude, school.longitude)
  }));

  // Sort ascending — nearest first
  schoolsWithDistance.sort((a, b) => a.distance_km - b.distance_km);

  return schoolsWithDistance;
};
