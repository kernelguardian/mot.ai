import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  registration: text("registration").notNull().unique(),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  fuelType: text("fuel_type"),
  engineSize: text("engine_size"),
  colour: text("colour"),
  motStatus: text("mot_status"),
  motExpiryDate: text("mot_expiry_date"),
  lastChecked: timestamp("last_checked").defaultNow(),
});

export const motTests = pgTable("mot_tests", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  testDate: text("test_date").notNull(),
  testResult: text("test_result").notNull(), // PASS, FAIL
  expiryDate: text("expiry_date"),
  odometerValue: integer("odometer_value"),
  odometerUnit: text("odometer_unit"),
  testNumber: text("test_number"),
  testCentre: text("test_centre"),
  failures: jsonb("failures"),
  advisories: jsonb("advisories"),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  riskLevel: text("risk_level").notNull(), // HIGH, MEDIUM, LOW
  confidence: integer("confidence").notNull(), // 0-100
  lastFailureDate: text("last_failure_date"),
  pattern: text("pattern"),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  lastChecked: true,
});

export const insertMotTestSchema = createInsertSchema(motTests).omit({
  id: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertMotTest = z.infer<typeof insertMotTestSchema>;
export type MotTest = typeof motTests.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;

// UK Registration validation schema
export const ukRegistrationSchema = z.string()
  .min(2, "Registration too short")
  .max(8, "Registration too long")
  .regex(/^[A-Z0-9\s]+$/, "Invalid characters in registration")
  .transform(val => val.replace(/\s/g, '').toUpperCase());
