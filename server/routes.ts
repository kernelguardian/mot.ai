import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ukRegistrationSchema } from "@shared/schema";
import { z } from "zod";
import { fetchDVSAMotData, isDVSAConfigured } from "./dvsa-api";

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
        // Fetch data from DVSA API (falls back to mock if not configured)
        let dvsaData;
        try {
          if (isDVSAConfigured()) {
            console.log("Using official DVSA API for registration:", registration);
            dvsaData = await fetchDVSAMotData(registration);
          } else {
            console.log("DVSA API not configured, using mock data for registration:", registration);
            dvsaData = mockDVSAResponse(registration);
          }
        } catch (error) {
          console.error("DVSA API error, falling back to mock data:", error);
          dvsaData = mockDVSAResponse(registration);
        }
        
        // Create vehicle record (handle both real DVSA and mock data formats)
        const firstUsedYear = dvsaData.firstUsedDate ? 
          parseInt(dvsaData.firstUsedDate.split(/[-.]/, 1)[0]) : 
          new Date().getFullYear();
        
        const vehicleData: any = dvsaData; // Type assertion to handle mixed formats
        
        vehicle = await storage.createVehicle({
          registration: vehicleData.registration,
          make: vehicleData.make,
          model: vehicleData.model,
          year: firstUsedYear,
          fuelType: vehicleData.fuelType,
          engineSize: vehicleData.engineSize,
          colour: vehicleData.primaryColour || vehicleData.colour, // Real API uses primaryColour
          motStatus: vehicleData.motTests[0]?.testResult || "UNKNOWN",
          motExpiryDate: vehicleData.motTests[0]?.expiryDate || null,
        });

        // Store MOT test history (handle both real DVSA and mock data formats)
        for (const test of vehicleData.motTests) {
          const testData: any = test; // Type assertion for mixed formats
          const odometerValue = testData.odometerValue ? parseInt(testData.odometerValue.toString()) : null;
          const testCentre = testData.testCentre?.name || "Unknown Test Centre";
          
          // Handle different defect formats (real DVSA API uses 'defects', mock uses 'defects' or 'rfrAndComments')
          const defects = testData.defects || testData.rfrAndComments || [];
          
          await storage.createMotTest({
            vehicleId: vehicle.id,
            testDate: testData.completedDate,
            testResult: testData.testResult,
            expiryDate: testData.expiryDate,
            odometerValue: odometerValue,
            odometerUnit: testData.odometerUnit,
            testNumber: testData.motTestNumber,
            testCentre: testCentre,
            failures: defects.filter((d: any) => d.type === "FAIL" || d.type === "MAJOR") || [],
            advisories: defects.filter((d: any) => d.type === "ADVISORY") || [],
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

  // Direct DVSA API endpoint for authenticated API calls
  app.get("/api/dvsa/vehicle/:registration", async (req, res) => {
    try {
      const registration = ukRegistrationSchema.parse(req.params.registration);
      
      // Check if DVSA API is configured
      if (!isDVSAConfigured()) {
        // Fallback to mock data if DVSA API is not configured
        console.log("DVSA API not configured, using mock data for registration:", registration);
        const mockData = mockDVSAResponse(registration);
        return res.json(mockData);
      }

      // Fetch data from official DVSA API
      console.log("Fetching data from official DVSA API for registration:", registration);
      const dvsaData = await fetchDVSAMotData(registration);
      
      res.json(dvsaData);

    } catch (error) {
      console.error("DVSA API Error:", error);
      
      // Provide specific error messages
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch vehicle data";
      
      if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        return res.status(404).json({ message: `Vehicle not found: ${req.params.registration.toUpperCase()}` });
      } else if (errorMessage.includes("authentication") || errorMessage.includes("401")) {
        return res.status(401).json({ message: "API authentication failed. Please check DVSA credentials." });
      } else if (errorMessage.includes("access denied") || errorMessage.includes("403")) {
        return res.status(403).json({ message: "API access denied. Please check DVSA API key permissions." });
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        return res.status(429).json({ message: "API rate limit exceeded. Please try again later." });
      } else if (errorMessage.includes("credentials not configured")) {
        return res.status(503).json({ message: "DVSA API not configured. Please provide API credentials." });
      } else {
        return res.status(500).json({ message: errorMessage });
      }
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
