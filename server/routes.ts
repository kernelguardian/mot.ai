import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ukRegistrationSchema } from "@shared/schema";
import { z } from "zod";

// Mock DVSA API data for demonstration
const mockDVSAResponse = (registration: string) => ({
  registration,
  make: "Ford",
  model: "Focus",
  firstUsedDate: "2018.03.15",
  fuelType: "Petrol",
  engineSize: "1596",
  colour: "Blue",
  motTests: [
    {
      completedDate: "2024.03.15",
      testResult: "PASS",
      expiryDate: "2025.03.15",
      odometerValue: "45231",
      odometerUnit: "mi",
      motTestNumber: "123456789012",
      testCentre: {
        name: "Quick Fit Motors",
        number: "V12345"
      },
      defects: []
    },
    {
      completedDate: "2024.03.08",
      testResult: "FAIL",
      expiryDate: null,
      odometerValue: "45228",
      odometerUnit: "mi",
      motTestNumber: "123456789011",
      testCentre: {
        name: "Quick Fit Motors",
        number: "V12345"
      },
      defects: [
        {
          text: "Front brake disc significantly and obviously worn on both sides",
          type: "FAIL",
          dangerous: false
        },
        {
          text: "Windscreen wiper blade deteriorated, torn or holed",
          type: "FAIL",
          dangerous: false
        }
      ]
    },
    {
      completedDate: "2023.03.22",
      testResult: "PASS",
      expiryDate: "2024.03.22",
      odometerValue: "38452",
      odometerUnit: "mi",
      motTestNumber: "123456789010",
      testCentre: {
        name: "AutoTest Centre",
        number: "V54321"
      },
      defects: [
        {
          text: "Nearside rear tyre tread depth low",
          type: "ADVISORY",
          dangerous: false
        }
      ]
    }
  ]
});

// Simple ML-like prediction logic
function generatePredictions(motHistory: any[]): any[] {
  const failurePatterns = new Map<string, number>();
  const advisoryPatterns = new Map<string, number>();
  
  // Analyze failure patterns
  motHistory.forEach(test => {
    if (test.defects) {
      test.defects.forEach((defect: any) => {
        const category = defect.text.toLowerCase();
        if (defect.type === "FAIL") {
          failurePatterns.set(category, (failurePatterns.get(category) || 0) + 1);
        } else if (defect.type === "ADVISORY") {
          advisoryPatterns.set(category, (advisoryPatterns.get(category) || 0) + 1);
        }
      });
    }
  });

  const predictions = [];

  // Brake disc prediction
  if (failurePatterns.has("front brake disc significantly and obviously worn on both sides")) {
    predictions.push({
      category: "Front Brake Disc",
      description: "Disc significantly and obviously worn on both sides",
      riskLevel: "HIGH",
      confidence: 85,
      lastFailureDate: "March 2024",
      pattern: "Previously failed",
      recommendations: "Replace brake discs before next MOT"
    });
  }

  // Wiper blade prediction
  if (failurePatterns.has("windscreen wiper blade deteriorated, torn or holed") || 
      advisoryPatterns.size > 0) {
    predictions.push({
      category: "Windscreen Wipers",
      description: "Wiper blade deteriorated, torn or holed",
      riskLevel: "MEDIUM",
      confidence: 72,
      lastFailureDate: null,
      pattern: "3 advisories in last 2 years",
      recommendations: "Check and replace wiper blades if worn"
    });
  }

  // Always add a low-risk prediction
  predictions.push({
    category: "Tyre Tread Depth",
    description: "Tyre tread depth below legal minimum",
    riskLevel: "LOW",
    confidence: 45,
    lastFailureDate: null,
    pattern: "No recent issues detected",
    recommendations: "Monitor tyre condition regularly"
  });

  return predictions;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Check MOT status for a vehicle by registration (creates new record)
  app.get("/api/vehicle/registration/:registration", async (req, res) => {
    try {
      const registration = ukRegistrationSchema.parse(req.params.registration);
      
      // Check if vehicle exists in our storage
      let vehicle = await storage.getVehicleByRegistration(registration);
      
      if (!vehicle) {
        // Simulate DVSA API call
        const dvsaData = mockDVSAResponse(registration);
        
        // Create vehicle record
        vehicle = await storage.createVehicle({
          registration: dvsaData.registration,
          make: dvsaData.make,
          model: dvsaData.model,
          year: parseInt(dvsaData.firstUsedDate.split('.')[0]),
          fuelType: dvsaData.fuelType,
          engineSize: dvsaData.engineSize,
          colour: dvsaData.colour,
          motStatus: dvsaData.motTests[0]?.testResult || "UNKNOWN",
          motExpiryDate: dvsaData.motTests[0]?.expiryDate || null,
        });

        // Store MOT test history
        for (const test of dvsaData.motTests) {
          await storage.createMotTest({
            vehicleId: vehicle.id,
            testDate: test.completedDate,
            testResult: test.testResult,
            expiryDate: test.expiryDate,
            odometerValue: parseInt(test.odometerValue),
            odometerUnit: test.odometerUnit,
            testNumber: test.motTestNumber,
            testCentre: test.testCentre.name,
            failures: test.defects?.filter(d => d.type === "FAIL") || [],
            advisories: test.defects?.filter(d => d.type === "ADVISORY") || [],
          });
        }

        // Generate AI predictions
        const predictions = generatePredictions(dvsaData.motTests);
        await storage.deletePredictionsByVehicleId(vehicle.id);
        
        for (const pred of predictions) {
          await storage.createPrediction({
            vehicleId: vehicle.id,
            ...pred,
          });
        }
      }

      // Get all related data
      const motTests = await storage.getMotTestsByVehicleId(vehicle.id);
      const predictions = await storage.getPredictionsByVehicleId(vehicle.id);

      res.json({
        vehicle,
        motTests,
        predictions,
        uuid: vehicle.uuid, // Return UUID for redirection
      });

    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      res.status(400).json({ 
        message: error instanceof z.ZodError 
          ? "Invalid registration format" 
          : "Failed to fetch vehicle data" 
      });
    }
  });

  // Get vehicle data by UUID (for unique links)
  app.get("/api/vehicle/:uuid", async (req, res) => {
    try {
      const uuid = req.params.uuid;
      
      const vehicle = await storage.getVehicleByUuid(uuid);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Get all related data
      const motTests = await storage.getMotTestsByVehicleId(vehicle.id);
      const predictions = await storage.getPredictionsByVehicleId(vehicle.id);

      res.json({
        vehicle,
        motTests,
        predictions,
      });

    } catch (error) {
      console.error("Error fetching vehicle data by UUID:", error);
      res.status(500).json({ message: "Failed to fetch vehicle data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
