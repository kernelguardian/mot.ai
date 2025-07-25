import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, TestTube, Car, Database } from "lucide-react";
import { fetchDVSAMotData } from "@/lib/mot-api";

export default function ApiTest() {
  const [testRegistration, setTestRegistration] = useState("AB12CDE");
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestApi = async () => {
    if (!testRegistration.trim()) {
      setError("Please enter a registration number");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const result = await fetchDVSAMotData(testRegistration);
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dvsa-blue to-dvsa-blue-dark text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <TestTube className="w-10 h-10" />
            DVSA API Test Console
          </h1>
          <p className="text-xl text-gray-200">
            Test your DVSA MOT History API integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Test Panel */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Car className="w-5 h-5" />
                API Connection Test
              </CardTitle>
              <CardDescription className="text-gray-200">
                Test the DVSA MOT History API with a sample registration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-registration" className="text-white">
                  Test Registration Number
                </Label>
                <Input
                  id="test-registration"
                  type="text"
                  placeholder="e.g. AB12 CDE"
                  value={testRegistration}
                  onChange={(e) => setTestRegistration(e.target.value.toUpperCase())}
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  maxLength={8}
                />
                <p className="text-sm text-gray-300">
                  Use a valid UK registration number for testing
                </p>
              </div>

              <Button
                onClick={handleTestApi}
                disabled={isLoading || !testRegistration.trim()}
                className="w-full bg-plate-yellow text-dvsa-blue hover:bg-yellow-400 font-bold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-dvsa-blue border-t-transparent rounded-full animate-spin" />
                    Testing API...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    Test DVSA API
                  </div>
                )}
              </Button>

              {/* Results */}
              {error && (
                <Alert className="bg-red-500/20 border-red-500/50">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    <strong>Error:</strong> {error}
                  </AlertDescription>
                </Alert>
              )}

              {testResult && (
                <Alert className="bg-green-500/20 border-green-500/50">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    <strong>Success!</strong> Retrieved data for {testResult.registration} ({testResult.make} {testResult.model})
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Configuration Status */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5" />
                Configuration Status
              </CardTitle>
              <CardDescription className="text-gray-200">
                Current API configuration and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white">DVSA API Integration</span>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200">
                    Mock Data Active
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-300">
                  <p>
                    <strong>Current Status:</strong> Using mock data for demonstration
                  </p>
                  <p>
                    <strong>To enable real data:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Register at <code className="bg-white/20 px-1 rounded">https://documentation.history.mot.api.gov.uk/</code></li>
                    <li>Add your DVSA credentials to environment variables</li>
                    <li>Restart the application</li>
                  </ul>
                </div>

                <Alert className="bg-blue-500/20 border-blue-500/50">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200">
                    <strong>Note:</strong> All features work identically with both real and mock data. 
                    The mock data provides realistic MOT test results for development and testing.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results Display */}
        {testResult && (
          <Card className="mt-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">API Response Data</CardTitle>
              <CardDescription className="text-gray-200">
                Raw data returned from the DVSA API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black/30 p-4 rounded-lg overflow-auto">
                <pre className="text-green-300 text-sm">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="text-center mt-8">
          <Button 
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={() => window.location.href = '/'}
          >
            ← Back to MOT Search
          </Button>
        </div>
      </div>
    </div>
  );
}