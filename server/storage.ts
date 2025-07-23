import { vehicles, motTests, predictions, type Vehicle, type InsertVehicle, type MotTest, type InsertMotTest, type Prediction, type InsertPrediction } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByUuid(uuid: string): Promise<Vehicle | undefined>;
  getVehicleByRegistration(registration: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;

  // MOT Test operations
  getMotTestsByVehicleId(vehicleId: number): Promise<MotTest[]>;
  createMotTest(motTest: InsertMotTest): Promise<MotTest>;

  // Prediction operations
  getPredictionsByVehicleId(vehicleId: number): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  deletePredictionsByVehicleId(vehicleId: number): Promise<void>;
}

// Simple UUID generator
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}



// rewrite MemStorage to DatabaseStorage
export class DatabaseStorage implements IStorage {
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async getVehicleByUuid(uuid: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.uuid, uuid));
    return vehicle || undefined;
  }

  async getVehicleByRegistration(registration: string): Promise<Vehicle | undefined> {
    const cleanedReg = registration.replace(/\s/g, '').toUpperCase();
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.registration, cleanedReg));
    return vehicle || undefined;
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const uuid = generateUuid();
    const [vehicle] = await db
      .insert(vehicles)
      .values({
        ...insertVehicle,
        uuid,
        registration: insertVehicle.registration.replace(/\s/g, '').toUpperCase(),
      })
      .returning();
    return vehicle;
  }

  async updateVehicle(id: number, vehicleUpdate: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .update(vehicles)
      .set({
        ...vehicleUpdate,
        lastChecked: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle || undefined;
  }

  async getMotTestsByVehicleId(vehicleId: number): Promise<MotTest[]> {
    const tests = await db
      .select()
      .from(motTests)
      .where(eq(motTests.vehicleId, vehicleId))
      .orderBy(motTests.testDate);
    return tests.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
  }

  async createMotTest(insertMotTest: InsertMotTest): Promise<MotTest> {
    const [motTest] = await db
      .insert(motTests)
      .values(insertMotTest)
      .returning();
    return motTest;
  }

  async getPredictionsByVehicleId(vehicleId: number): Promise<Prediction[]> {
    const preds = await db
      .select()
      .from(predictions)
      .where(eq(predictions.vehicleId, vehicleId));
    
    return preds.sort((a, b) => {
      const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0) - 
             (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0);
    });
  }

  async createPrediction(insertPrediction: InsertPrediction): Promise<Prediction> {
    const [prediction] = await db
      .insert(predictions)
      .values(insertPrediction)
      .returning();
    return prediction;
  }

  async deletePredictionsByVehicleId(vehicleId: number): Promise<void> {
    await db.delete(predictions).where(eq(predictions.vehicleId, vehicleId));
  }
}

export const storage = new DatabaseStorage();
