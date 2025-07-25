export interface PredictionAnalysis {
  totalTests: number;
  failures: number;
  advisories: number;
  successRate: number;
  riskScore: number;
}

export interface NextMotIssue {
  id: string;
  component: string;
  issue: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number;
  estimatedCost: string;
  priority: number;
  recommendation: string;
}

export function analyzeMotHistory(motTests: any[]): PredictionAnalysis {
  const totalTests = motTests.length;
  const failures = motTests.filter(test => test.testResult === "FAIL").length;
  
  let advisoryCount = 0;
  motTests.forEach(test => {
    if (test.advisories && Array.isArray(test.advisories)) {
      advisoryCount += test.advisories.length;
    }
  });

  const successRate = totalTests > 0 ? Math.round(((totalTests - failures) / totalTests) * 100) : 0;
  
  // Simple risk scoring: more failures and advisories = higher risk
  const riskScore = Math.min(100, (failures * 25) + (advisoryCount * 5));

  return {
    totalTests,
    failures,
    advisories: advisoryCount,
    successRate,
    riskScore
  };
}

export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case "HIGH":
      return "bg-gov-red";
    case "MEDIUM":
      return "bg-gov-orange";
    case "LOW":
      return "bg-gov-green";
    default:
      return "bg-gray-500";
  }
}

export function getTestStatusColor(result: string): string {
  switch (result) {
    case "PASS":
      return "bg-gov-green";
    case "FAIL":
      return "bg-gov-red";
    default:
      return "bg-gray-500";
  }
}

export function formatDate(dateString: string, includeTime: boolean = false): string {
  if (!dateString) return 'N/A';
  
  try {
    // Parse the date - handle different formats
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // Try DVSA format if standard parsing fails
      if (dateString.includes('.')) {
        const parts = dateString.split('.');
        if (parts.length === 3) {
          const parsedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          if (!isNaN(parsedDate.getTime())) {
            date.setTime(parsedDate.getTime());
          } else {
            throw new Error('Invalid date');
          }
        } else {
          throw new Error('Invalid date format');
        }
      } else {
        throw new Error('Invalid date');
      }
    }
    
    if (includeTime) {
      // Format: "15-July-2024 2:30 PM"
      const day = date.getDate();
      const month = date.toLocaleDateString('en-GB', { month: 'long' });
      const year = date.getFullYear();
      const time = date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return `${day}-${month}-${year} ${time}`;
    } else {
      // Format: "15-July-2024"
      const day = date.getDate();
      const month = date.toLocaleDateString('en-GB', { month: 'long' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {
    // Return original string if parsing fails
    return dateString || 'N/A';
  }
}

export function calculateDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  
  try {
    const expiry = new Date(expiryDate.replace(/\./g, '-'));
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

// Dummy data for next MOT predictions
export function getNextMotPredictions(vehicleAge: number, fuelType: string): NextMotIssue[] {
  const baseIssues: NextMotIssue[] = [
    {
      id: 'brakes-1',
      component: 'Brakes',
      issue: 'Brake disc wear approaching limits',
      riskLevel: 'MEDIUM',
      probability: 68,
      estimatedCost: '£120-180',
      priority: 1,
      recommendation: 'Inspect brake discs and pads before next MOT'
    },
    {
      id: 'tyres-1',
      component: 'Tyres',
      issue: 'Front tyre tread depth declining',
      riskLevel: 'LOW',
      probability: 42,
      estimatedCost: '£80-120',
      priority: 3,
      recommendation: 'Monitor tread depth, consider replacement if below 2.5mm'
    },
    {
      id: 'lights-1',
      component: 'Lights',
      issue: 'Headlight alignment may require adjustment',
      riskLevel: 'LOW',
      probability: 35,
      estimatedCost: '£25-45',
      priority: 4,
      recommendation: 'Check headlight alignment at service'
    },
    {
      id: 'suspension-1',
      component: 'Suspension',
      issue: 'Shock absorber performance degradation',
      riskLevel: 'MEDIUM',
      probability: 55,
      estimatedCost: '£150-250',
      priority: 2,
      recommendation: 'Have suspension system inspected by qualified mechanic'
    }
  ];

  // Adjust predictions based on vehicle age and fuel type
  if (vehicleAge > 8) {
    baseIssues.push({
      id: 'exhaust-1',
      component: 'Exhaust',
      issue: 'Exhaust system corrosion potential',
      riskLevel: 'HIGH',
      probability: 78,
      estimatedCost: '£200-350',
      priority: 1,
      recommendation: 'Annual exhaust system inspection recommended'
    });
  }

  if (fuelType === 'Diesel') {
    baseIssues.push({
      id: 'emissions-1',
      component: 'Emissions',
      issue: 'DPF filter efficiency declining',
      riskLevel: 'MEDIUM',
      probability: 62,
      estimatedCost: '£300-500',
      priority: 2,
      recommendation: 'Regular long drives to maintain DPF health'
    });
  }

  return baseIssues.sort((a, b) => a.priority - b.priority);
}
