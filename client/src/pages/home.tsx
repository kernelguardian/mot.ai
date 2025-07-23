import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Shield, Database, Brain, History, TriangleAlert, Gem, Wrench, Search, Lock } from "lucide-react";
import { validateUKRegistration, formatRegistration } from "@/lib/mot-api";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [registration, setRegistration] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registration.trim()) {
      toast({
        title: "Registration Required",
        description: "Please enter a vehicle registration number",
        variant: "destructive",
      });
      return;
    }

    if (!validateUKRegistration(registration)) {
      toast({
        title: "Invalid Registration",
        description: "Please enter a valid UK vehicle registration (e.g., AB12 CDE)",
        variant: "destructive",
      });
      return;
    }

    const cleanedReg = registration.replace(/\s/g, '').toUpperCase();
    setLocation(`/vehicle/${cleanedReg}`);
  };

  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
    setRegistration(value);
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
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-plate-yellow hover-yellow font-medium">Home</a>
              <a href="#" className="text-plate-yellow hover-yellow font-medium">About</a>
              <a href="#" className="text-plate-yellow hover-yellow font-medium">API</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-dvsa text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AI-Powered MOT Analysis
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Check your vehicle's MOT status and get intelligent predictions for upcoming issues
          </p>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="text-plate-yellow text-2xl w-8 h-8" />
              <span className="text-lg font-medium">Powered by DVSA Official Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Input Section */}
      <section className="py-16 bg-gov-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-dvsa-blue mb-4">Enter Vehicle Registration</h2>
                <p className="text-gov-gray text-lg">
                  Enter your UK vehicle registration number to check MOT status and get AI predictions
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="registration" className="block text-sm font-medium text-dvsa-blue mb-2">
                    Vehicle Registration Number
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      id="registration"
                      placeholder="e.g. AB12 CDE"
                      value={registration}
                      onChange={handleRegistrationChange}
                      className="w-full px-4 py-4 text-2xl font-plate uppercase tracking-wider text-center border-4 border-plate-yellow focus:border-plate-yellow focus:ring-4 focus:ring-plate-yellow focus:ring-opacity-50 registration-input"
                      maxLength={8}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Car className="text-plate-yellow text-xl w-6 h-6" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gov-gray">
                    UK registration format: letters and numbers (e.g. AB12 CDE, A123 BCD)
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full dvsa-blue hover:bg-blue-800 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-dvsa-light-blue focus:ring-opacity-50"
                >
                  <Search className="mr-2 w-5 h-5" />
                  Check MOT Status
                </Button>
              </form>

              {/* Trust Indicators */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="bg-gov-green text-white w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-dvsa-blue">Secure & Private</h3>
                    <p className="text-sm text-gov-gray mt-1">Your data is not stored</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-dvsa-light-blue text-white w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <Database className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-dvsa-blue">Official DVSA Data</h3>
                    <p className="text-sm text-gov-gray mt-1">Real-time government records</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-plate-yellow text-dvsa-blue w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <Brain className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-dvsa-blue">AI Predictions</h3>
                    <p className="text-sm text-gov-gray mt-1">Smart failure analysis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dvsa-blue mb-4">Why Use MOT.AI?</h2>
            <p className="text-xl text-gov-gray">Advanced analytics for better vehicle maintenance planning</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-gov-bg hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="dvsa-blue text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-dvsa-blue mb-2">Complete History</h3>
                <p className="text-gov-gray text-sm">View all past MOT tests and results</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gov-bg hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="bg-gov-orange text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TriangleAlert className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-dvsa-blue mb-2">Failure Patterns</h3>
                <p className="text-gov-gray text-sm">Identify recurring issues and trends</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gov-bg hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="bg-plate-yellow text-dvsa-blue w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gem className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-dvsa-blue mb-2">Smart Predictions</h3>
                <p className="text-gov-gray text-sm">AI-powered failure risk assessment</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gov-bg hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="bg-gov-green text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-dvsa-blue mb-2">Maintenance Tips</h3>
                <p className="text-gov-gray text-sm">Actionable advice for prevention</p>
              </CardContent>
            </Card>
          </div>
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
