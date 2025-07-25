import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ukRegistrationSchema } from "@shared/schema";
import { z } from "zod";
import { fetchDVSAMotData, isDVSAConfigured } from "./dvsa-api";
import { generateMOTPredictions } from "./ai-service";





export async function registerRoutes(app: Express): Promise<Server> {
  
  // Check MOT status for a vehicle by registration (creates new record)
  app.get("/api/vehicle/registration/:registration", async (req, res) => {
    try {
      const registration = ukRegistrationSchema.parse(req.params.registration);
      
      // Check if vehicle exists in our storage
      let vehicle = await storage.getVehicleByRegistration(registration);
      
      if (!vehicle) {
        // Only use real DVSA API data - no mock fallback
        if (!isDVSAConfigured()) {
          return res.status(503).json({ 
            error: "DVSA API not configured",
            message: "Please configure DVSA API credentials to access real MOT data"
          });
        }

        console.log("Using official DVSA API for registration:", registration);
        const dvsaData = await fetchDVSAMotData(registration);
        
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

        // Generate AI predictions using the dummy AI service
        const storedMotTests = await storage.getMotTestsByVehicleId(vehicle.id);
        const aiPredictions = await generateMOTPredictions({
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          fuelType: vehicle.fuelType,
          registration: vehicle.registration
        }, storedMotTests);
        
        // Store AI predictions
        await storage.deletePredictionsByVehicleId(vehicle.id);
        
        for (const prediction of aiPredictions) {
          await storage.createPrediction({
            vehicleId: vehicle.id,
            category: prediction.category,
            description: prediction.description,
            riskLevel: prediction.riskLevel,
            confidence: prediction.confidence,
            lastFailureDate: prediction.lastFailureDate,
            pattern: prediction.pattern,
            recommendations: prediction.recommendations,
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
      
      // Check if DVSA API is configured - only use real data
      if (!isDVSAConfigured()) {
        return res.status(503).json({ 
          error: "DVSA API not configured",
          message: "Please configure DVSA API credentials to access real MOT data"
        });
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
