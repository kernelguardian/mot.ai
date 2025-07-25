import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Car, CheckCircle, Clock, AlertTriangle, Brain, History, ChevronDown, Info, X, Eye, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { fetchVehicleDataByUuid } from "@/lib/mot-api";
import { analyzeMotHistory, getRiskLevelColor, getTestStatusColor, formatDate, calculateDaysUntilExpiry } from "@/lib/ai-predictions";

interface VehicleDetailsProps {
  params: {
    id: string;
  };
}

export default function VehicleDetails({ params }: VehicleDetailsProps) {
  const [, setLocation] = useLocation();
  const { id: uuid } = params;
  const [expandedAdvisories, setExpandedAdvisories] = useState<Set<number>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/vehicle", uuid],
    queryFn: () => fetchVehicleDataByUuid(uuid),
    enabled: !!uuid,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gov-gray">Fetching vehicle data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-gov-red mx-auto mb-4" />
            <h2 className="text-xl font-bold text-dvsa-blue mb-2">Vehicle Not Found</h2>
            <p className="text-gov-gray mb-4">
              Unable to find vehicle data for this link. The vehicle may not exist or the link may be invalid.
            </p>
            <Button onClick={() => setLocation("/")} className="dvsa-blue">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { vehicle, motTests, predictions } = data;
  const stats = analyzeMotHistory(motTests);
  const daysUntilExpiry = calculateDaysUntilExpiry(vehicle.motExpiryDate);

  const toggleAdvisories = (testId: number) => {
    const newExpanded = new Set(expandedAdvisories);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedAdvisories(newExpanded);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="dvsa-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-plate-yellow text-dvsa-blue px-3 py-2 rounded font-bold text-xl">
                MOT.AI
              </div>
              <span className="text-lg font-medium">Vehicle MOT Intelligence</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="text-dvsa-blue hover:text-blue-800 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Button>
              <span className="text-gov-gray">|</span>
              <span className="font-plate text-xl text-dvsa-blue">{vehicle.registration}</span>
            </div>
            <Button
              variant="link"
              onClick={() => setLocation("/")}
              className="text-plate-yellow hover-yellow font-medium underline"
            >
              Check Another Vehicle
            </Button>
          </div>
          
          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="text-dvsa-blue hover:text-blue-800 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Button>
              <span className="font-plate text-lg text-dvsa-blue">{vehicle.registration}</span>
            </div>
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setLocation("/")}
                className="text-plate-yellow hover-yellow font-medium underline text-sm"
              >
                Check Another Vehicle
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Overview */}
      <section className="py-8 bg-gov-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg overflow-hidden">
            <div className="dvsa-blue text-white px-6 py-4">
              <h1 className="text-2xl font-bold flex items-center">
                <Car className="mr-3 w-6 h-6" />
                Vehicle MOT Status
              </h1>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vehicle Info */}
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-dvsa-blue">
                          {vehicle.make} {vehicle.model} {vehicle.engineSize ? `${parseFloat(vehicle.engineSize)/1000}L` : ''}
                        </h2>
                        <p className="text-gov-gray">
                          {vehicle.year} • {vehicle.fuelType} • {vehicle.colour}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${vehicle.motStatus === 'PASS' ? 'bg-gov-green' : 'bg-gov-red'} text-white`}>
                          {vehicle.motStatus === 'PASS' ? 
                            <CheckCircle className="w-4 h-4 mr-1" /> : 
                            <X className="w-4 h-4 mr-1 font-bold" />
                          }
                          {vehicle.motStatus === 'PASS' ? 'VALID MOT' : 'INVALID MOT'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="text-sm font-medium text-gov-gray">MOT Expiry Date</label>
                        <p className="text-lg font-semibold text-dvsa-blue">
                          {vehicle.motExpiryDate ? formatDate(vehicle.motExpiryDate) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gov-gray">Days Remaining</label>
                        <p className={`text-lg font-semibold ${daysUntilExpiry && daysUntilExpiry < 30 ? 'text-gov-red' : 'text-gov-orange'}`}>
                          {daysUntilExpiry ? `${daysUntilExpiry} days` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gov-bg rounded-lg p-4">
                  <h3 className="font-semibold text-dvsa-blue mb-3">MOT Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gov-gray text-sm">Total Tests:</span>
                      <span className="font-medium">{stats.totalTests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gov-gray text-sm">Failures:</span>
                      <span className="font-medium text-gov-red">{stats.failures}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gov-gray text-sm">Advisories:</span>
                      <span className="font-medium text-gov-orange">{stats.advisories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gov-gray text-sm">Success Rate:</span>
                      <span className="font-medium text-gov-green">{stats.successRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* AI Predictions */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg overflow-hidden">
            <div className="bg-plate-yellow text-dvsa-blue px-6 py-4">
              <h2 className="text-xl font-bold flex items-center">
                <Brain className="mr-3 w-6 h-6" />
                AI Failure Predictions
              </h2>
            </div>
            
            <CardContent className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-dvsa-light-blue">
                <p className="text-sm text-dvsa-blue">
                  <Info className="inline w-4 h-4 mr-2" />
                  Based on historical MOT data and vehicle patterns, our AI identifies potential issues for your next test.
                </p>
              </div>

              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <Card key={prediction.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-dvsa-blue">
                            {prediction.category}
                          </h3>
                          <p className="text-gov-gray text-sm mt-1">
                            {prediction.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <Badge className={`${getRiskLevelColor(prediction.riskLevel)} text-white`}>
                            {prediction.riskLevel} RISK
                          </Badge>
                          <p className="text-sm text-gov-gray mt-1">{prediction.confidence}% confidence</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gov-gray">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>
                            {prediction.lastFailureDate 
                              ? `Last failed: ${prediction.lastFailureDate}`
                              : prediction.pattern || 'No pattern detected'}
                          </span>
                        </div>
                        {prediction.recommendations && (
                          <Button variant="link" className="text-dvsa-light-blue hover:text-blue-800 text-sm font-medium p-0">
                            View Recommendations
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* MOT History History */}
      <section className="py-8 bg-gov-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg overflow-hidden">
            <div className="dvsa-blue text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center">
                <History className="mr-3 w-6 h-6" />
                MOT Test History
              </h2>
            </div>
            
            <CardContent className="p-6">
              <div className="space-y-6">
                {motTests.map((test, index) => (
                  <div key={test.id} className={`relative pl-8 pb-6 ${index < motTests.length - 1 ? `border-l-2 ${test.testResult === 'PASS' ? 'border-gov-green' : 'border-gov-red'}` : ''}`}>
                    <div className="absolute -left-3 top-0">
                      <div className={`${getTestStatusColor(test.testResult)} text-white w-6 h-6 rounded-full flex items-center justify-center`}>
                        {test.testResult === 'PASS' ? 
                          <CheckCircle className="w-3 h-3" /> : 
                          <X className="w-3 h-3 font-bold" />
                        }
                      </div>
                    </div>
                    <Card className={`${test.testResult === 'PASS' ? 'bg-green-50' : 'bg-red-50'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className={`font-semibold ${test.testResult === 'PASS' ? 'text-gov-green' : 'text-gov-red'}`}>
                              {formatDate(test.testDate)}
                            </h3>
                            <p className="text-sm text-gov-gray">Test #: {test.testNumber}</p>
                          </div>
                          <Badge className={`${getTestStatusColor(test.testResult)} text-white`}>
                            {test.testResult}
                          </Badge>
                        </div>
                        
                        {test.testResult === 'FAIL' && test.failures && test.failures.length > 0 && (
                          <div className="mt-3">
                            <h4 className="font-medium text-gov-red mb-2">Failure Reasons:</h4>
                            <ul className="text-sm text-gov-gray space-y-1">
                              {test.failures.map((failure: any, idx: number) => (
                                <li key={idx}>• {failure.text || failure}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {test.advisories && test.advisories.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gov-orange">
                                Advisories ({test.advisories.length})
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAdvisories(test.id)}
                                className="text-gov-orange hover:text-orange-800 p-1"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {expandedAdvisories.has(test.id) ? 'Hide' : 'Show'}
                                {expandedAdvisories.has(test.id) ? 
                                  <ChevronUp className="w-4 h-4 ml-1" /> : 
                                  <ChevronDown className="w-4 h-4 ml-1" />
                                }
                              </Button>
                            </div>
                            
                            {expandedAdvisories.has(test.id) && (
                              <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <ul className="text-sm text-gov-gray space-y-1">
                                  {test.advisories.map((advisory: any, idx: number) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-gov-orange mr-2">•</span>
                                      <span>{advisory.text || advisory}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200">
                          <div>
                            <span className="text-xs text-gov-gray">Mileage</span>
                            <p className="font-medium">
                              {test.odometerValue ? `${test.odometerValue.toLocaleString()} ${test.odometerUnit}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gov-gray">
                              {test.testResult === 'FAIL' ? 'Failures' : 'Advisories'}
                            </span>
                            <p className={`font-medium ${test.testResult === 'FAIL' ? 'text-gov-red' : 'text-gov-orange'}`}>
                              {test.testResult === 'FAIL' 
                                ? `${test.failures?.length || 0} items`
                                : `${test.advisories?.length || 0} items`
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gov-gray">Test Centre</span>
                            <p className="font-medium text-sm">{test.testCentre}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {motTests.length > 3 && (
                <div className="text-center mt-6">
                  <Button variant="ghost" className="text-dvsa-light-blue hover:text-blue-800 font-medium">
                    <ChevronDown className="w-4 h-4 mr-2" />
                    View All Tests ({motTests.length} total)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-blue-50 border border-dvsa-light-blue">
            <CardContent className="p-6">
              <div className="flex items-start">
                <Info className="text-dvsa-light-blue w-6 h-6 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-dvsa-blue mb-2">Important Disclaimer</h3>
                  <p className="text-sm text-dvsa-blue leading-relaxed">
                    AI predictions are based on historical patterns and should not replace professional vehicle inspection. 
                    Always consult qualified mechanics and follow manufacturer guidelines. MOT.AI is not affiliated with DVSA 
                    but uses official government data. Prediction accuracy may vary and is provided for guidance only.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="dvsa-blue text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-plate-yellow text-dvsa-blue px-2 py-1 rounded font-bold">MOT.AI</div>
              </div>
              <p className="text-blue-100 text-sm">
                Intelligent MOT analysis powered by machine learning and official DVSA data.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-blue-100">
                <li><a href="#" className="hover-yellow">MOT Check</a></li>
                <li><a href="#" className="hover-yellow">AI Predictions</a></li>
                <li><a href="#" className="hover-yellow">Vehicle History</a></li>
                <li><a href="#" className="hover-yellow">API Access</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-blue-100">
                <li><a href="#" className="hover-yellow">Help Centre</a></li>
                <li><a href="#" className="hover-yellow">Contact Us</a></li>
                <li><a href="#" className="hover-yellow">Privacy Policy</a></li>
                <li><a href="#" className="hover-yellow">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Data Sources</h3>
              <ul className="space-y-2 text-sm text-blue-100">
                <li><a href="#" className="hover-yellow">DVSA MOT API</a></li>
                <li><a href="#" className="hover-yellow">Official Records</a></li>
                <li><a href="#" className="hover-yellow">Government Data</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-sm text-blue-100">
            <p>&copy; 2024 MOT.AI. This service uses DVSA data but is not affiliated with or endorsed by DVSA.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
