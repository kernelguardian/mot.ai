import { apiRequest } from "./queryClient";

export interface VehicleData {
  vehicle: {
    id: number;
    registration: string;
    make: string | null;
    model: string | null;
    year: number | null;
    fuelType: string | null;
    engineSize: string | null;
    colour: string | null;
    motStatus: string | null;
    motExpiryDate: string | null;
    lastChecked: Date;
  };
  motTests: Array<{
    id: number;
    vehicleId: number;
    testDate: string;
    testResult: string;
    expiryDate: string | null;
    odometerValue: number | null;
    odometerUnit: string | null;
    testNumber: string | null;
    testCentre: string | null;
    failures: any[];
    advisories: any[];
  }>;
  predictions: Array<{
    id: number;
    vehicleId: number;
    category: string;
    description: string;
    riskLevel: string;
    confidence: number;
    lastFailureDate: string | null;
    pattern: string | null;
    recommendations: string | null;
    createdAt: Date;
  }>;
}

export async function fetchVehicleDataByRegistration(registration: string): Promise<VehicleData & { uuid: string }> {
  const response = await apiRequest("GET", `/api/vehicle/registration/${registration}`);
  return await response.json();
}

export async function fetchVehicleDataByUuid(uuid: string): Promise<VehicleData> {
  const response = await apiRequest("GET", `/api/vehicle/${uuid}`);
  return await response.json();
}

export function validateUKRegistration(registration: string): boolean {
  // Remove spaces and convert to uppercase
  const cleaned = registration.replace(/\s/g, '').toUpperCase();
  
  // UK registration patterns
  const patterns = [
    /^[A-Z]{1,3}[0-9]{1,4}$/,           // Old format: A123, AB123, ABC123
    /^[A-Z][0-9]{1,3}[A-Z]{3}$/,        // A123ABC
    /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/,       // AB12CDE (current format)
  ];
  
  return patterns.some(pattern => pattern.test(cleaned)) && cleaned.length >= 2 && cleaned.length <= 8;
}

export function formatRegistration(registration: string): string {
  const cleaned = registration.replace(/\s/g, '').toUpperCase();
  
  // Format current style: AB12CDE -> AB12 CDE
  if (cleaned.length === 7 && /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  
  return cleaned;
}
