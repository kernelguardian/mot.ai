// Dummy AI Service for MOT Predictions
// This simulates an AI API that would analyze MOT history and generate predictions

import type { MotTest } from "@shared/schema";

export interface AIPrediction {
  category: string;
  description: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  lastFailureDate: string | null;
  pattern: string;
  recommendations: string;
}

// Simulate AI API delay
const simulateAPIDelay = () => new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

// Common MOT failure categories with AI-like analysis
const FAILURE_CATEGORIES = {
  BRAKES: {
    keywords: ['brake', 'disc', 'pad', 'handbrake'],
    category: 'Brake System',
    recommendations: 'Replace brake components before next MOT'
  },
  LIGHTS: {
    keywords: ['light', 'bulb', 'headlight', 'indicator', 'lamp'],
    category: 'Lighting System', 
    recommendations: 'Check and replace faulty bulbs or electrical connections'
  },
  TYRES: {
    keywords: ['tyre', 'tire', 'tread', 'wheel'],
    category: 'Tyre Condition',
    recommendations: 'Monitor tyre condition and replace when worn'
  },
  SUSPENSION: {
    keywords: ['suspension', 'shock', 'spring', 'strut'],
    category: 'Suspension System',
    recommendations: 'Have suspension components inspected professionally'
  },
  EXHAUST: {
    keywords: ['exhaust', 'emission', 'catalytic'],
    category: 'Exhaust System',
    recommendations: 'Check exhaust system for leaks or component wear'
  },
  WIPERS: {
    keywords: ['wiper', 'windscreen', 'washer'],
    category: 'Windscreen System',
    recommendations: 'Replace wiper blades and check washer system'
  }
};

/**
 * Dummy AI API call to generate MOT predictions based on vehicle history
 * In a real implementation, this would call an external AI service
 */
export async function generateMOTPredictions(
  vehicleData: {
    make: string;
    model: string;
    year: number;
    fuelType: string;
    registration: string;
  },
  motHistory: MotTest[]
): Promise<AIPrediction[]> {
  
  console.log(`🤖 AI Service: Analyzing MOT history for ${vehicleData.registration} (${vehicleData.make} ${vehicleData.model})`);
  
  // Simulate AI processing time
  await simulateAPIDelay();
  
  const predictions: AIPrediction[] = [];
  const failurePatterns = new Map<string, { count: number, lastDate: string | null, failures: string[] }>();
  
  // Analyze failure patterns from MOT history
  motHistory.forEach(test => {
    if (test.failures && Array.isArray(test.failures) && test.failures.length > 0) {
      test.failures.forEach((failure: any) => {
        const failureText = failure.text?.toLowerCase() || '';
        
        // Categorize failure using AI-like pattern matching
        for (const [key, category] of Object.entries(FAILURE_CATEGORIES)) {
          if (category.keywords.some(keyword => failureText.includes(keyword))) {
            const existing = failurePatterns.get(category.category) || { count: 0, lastDate: null, failures: [] };
            existing.count++;
            existing.lastDate = test.testDate;
            existing.failures.push(failure.text);
            failurePatterns.set(category.category, existing);
            break;
          }
        }
      });
    }
  });
  
  // Generate predictions based on failure patterns
  failurePatterns.forEach((pattern, category) => {
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    let confidence = 30;
    
    // AI risk assessment logic
    if (pattern.count >= 2) {
      riskLevel = "HIGH";
      confidence = 85;
    } else if (pattern.count === 1) {
      const monthsSinceFailure = pattern.lastDate ? 
        Math.floor((Date.now() - new Date(pattern.lastDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
      
      if (monthsSinceFailure < 12) {
        riskLevel = "MEDIUM";
        confidence = 65;
      } else {
        riskLevel = "LOW";
        confidence = 40;
      }
    }
    
    const categoryInfo = Object.values(FAILURE_CATEGORIES).find(cat => cat.category === category);
    
    predictions.push({
      category,
      description: pattern.failures[0] || `${category} issues detected`,
      riskLevel,
      confidence,
      lastFailureDate: pattern.lastDate ? formatDate(pattern.lastDate) : null,
      pattern: pattern.count > 1 ? `Previously failed ${pattern.count} times` : 'Previous failure detected',
      recommendations: categoryInfo?.recommendations || 'Have component inspected before next MOT'
    });
  });
  
  // Add vehicle age-based predictions using AI analysis
  const vehicleAge = new Date().getFullYear() - vehicleData.year;
  
  if (vehicleAge > 10) {
    predictions.push({
      category: 'Age-Related Wear',
      description: 'Components may show age-related deterioration',
      riskLevel: 'MEDIUM',
      confidence: 60,
      lastFailureDate: null,
      pattern: `Vehicle is ${vehicleAge} years old`,
      recommendations: 'Regular maintenance recommended for older vehicles'
    });
  }
  
  // Add fuel-type specific predictions
  if (vehicleData.fuelType?.toLowerCase().includes('diesel')) {
    predictions.push({
      category: 'Diesel Emissions',
      description: 'Diesel particulate filter and emissions system monitoring',
      riskLevel: 'LOW',
      confidence: 45,
      lastFailureDate: null,
      pattern: 'Diesel vehicle analysis',
      recommendations: 'Regular highway driving helps maintain DPF system'
    });
  }
  
  // Ensure at least one prediction for demonstration
  if (predictions.length === 0) {
    predictions.push({
      category: 'General Maintenance',
      description: 'Routine maintenance items to monitor',
      riskLevel: 'LOW',
      confidence: 35,
      lastFailureDate: null,
      pattern: 'Preventive analysis',
      recommendations: 'Continue regular maintenance schedule'
    });
  }
  
  console.log(`🤖 AI Service: Generated ${predictions.length} predictions for ${vehicleData.registration}`);
  
  return predictions;
}

/**
 * Format date for display in predictions
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'long' 
  });
}

/**
 * Check if AI service is available (always true for dummy service)
 */
export function isAIServiceAvailable(): boolean {
  return true;
}

/**
 * Get AI service status for debugging
 */
export function getAIServiceStatus() {
  return {
    status: 'active',
    service: 'dummy-ai-api',
    version: '1.0.0',
    features: ['mot-prediction', 'risk-assessment', 'pattern-analysis']
  };
}