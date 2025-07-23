import { vehicles, motTests, predictions, type Vehicle, type InsertVehicle, type MotTest, type InsertMotTest, type Prediction, type InsertPrediction } from "@shared/schema";

export interface IStorage {
  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
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

export class MemStorage implements IStorage {
  private vehicles: Map<number, Vehicle>;
  private motTests: Map<number, MotTest>;
  private predictions: Map<number, Prediction>;
  private currentVehicleId: number;
  private currentMotTestId: number;
  private currentPredictionId: number;

  constructor() {
    this.vehicles = new Map();
    this.motTests = new Map();
    this.predictions = new Map();
    this.currentVehicleId = 1;
    this.currentMotTestId = 1;
    this.currentPredictionId = 1;
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehicleByRegistration(registration: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(
      vehicle => vehicle.registration === registration.replace(/\s/g, '').toUpperCase()
    );
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentVehicleId++;
    const vehicle: Vehicle = {
      ...insertVehicle,
      id,
      registration: insertVehicle.registration.replace(/\s/g, '').toUpperCase(),
      lastChecked: new Date(),
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, vehicleUpdate: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existing = this.vehicles.get(id);
    if (!existing) return undefined;

    const updated: Vehicle = {
      ...existing,
      ...vehicleUpdate,
      lastChecked: new Date(),
    };
    this.vehicles.set(id, updated);
    return updated;
  }

  async getMotTestsByVehicleId(vehicleId: number): Promise<MotTest[]> {
    return Array.from(this.motTests.values())
      .filter(test => test.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
  }

  async createMotTest(insertMotTest: InsertMotTest): Promise<MotTest> {
    const id = this.currentMotTestId++;
    const motTest: MotTest = { ...insertMotTest, id };
    this.motTests.set(id, motTest);
    return motTest;
  }

  async getPredictionsByVehicleId(vehicleId: number): Promise<Prediction[]> {
    return Array.from(this.predictions.values())
      .filter(prediction => prediction.vehicleId === vehicleId)
      .sort((a, b) => {
        const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0) - 
               (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0);
      });
  }

  async createPrediction(insertPrediction: InsertPrediction): Promise<Prediction> {
    const id = this.currentPredictionId++;
    const prediction: Prediction = {
      ...insertPrediction,
      id,
      createdAt: new Date(),
    };
    this.predictions.set(id, prediction);
    return prediction;
  }

  async deletePredictionsByVehicleId(vehicleId: number): Promise<void> {
    const toDelete = Array.from(this.predictions.entries())
      .filter(([_, prediction]) => prediction.vehicleId === vehicleId)
      .map(([id]) => id);
    
    toDelete.forEach(id => this.predictions.delete(id));
  }
}

export const storage = new MemStorage();
