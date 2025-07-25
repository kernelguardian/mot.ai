export interface PredictionAnalysis {
  totalTests: number;
  failures: number;
  advisories: number;
  successRate: number;
  riskScore: number;
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

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    // Handle DVSA format: "2024.03.15" or ISO format
    let date: Date;
    
    if (dateString.includes('.')) {
      // DVSA format: "2024.03.15"
      const parts = dateString.split('.');
      if (parts.length === 3) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        throw new Error('Invalid date format');
      }
    } else {
      // ISO format or other
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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
