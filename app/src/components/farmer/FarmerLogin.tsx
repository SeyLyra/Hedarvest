"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Wheat, X, Search, MapPin, Star, Phone, MessageCircle } from "lucide-react";

interface FarmerLoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export default function FarmerLogin({ onLogin, isLoading = false, error }: FarmerLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showContactAgent, setShowContactAgent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-agricultural-green/5 via-trust-blue/5 to-golden-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-2xl flex items-center justify-center">
            <Wheat className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            Farmer Login
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Access your farming dashboard and manage your crops
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-base pr-12"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 text-base bg-gradient-to-r from-agricultural-green to-trust-blue hover:from-agricultural-green/90 hover:to-trust-blue/90 text-white font-semibold"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto text-agricultural-green hover:text-trust-blue"
                onClick={() => setShowContactAgent(true)}
              >
                Find local warehouse
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Find Warehouse Modal */}
      {showContactAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-2xl font-bold">Find Local Warehouses</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowContactAgent(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Find nearby warehouses where you can store and tokenize your crops.
                </p>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search warehouses</Label>
                    <div className="relative">
                      <Input
                        id="search"
                        placeholder="Search by warehouse name, location, or crop type..."
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    </div>
                  </div>
                  <div className="md:w-48">
                    <Label htmlFor="specialty">Crop Type</Label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">All Crop Types</option>
                      <option value="rice">Rice</option>
                      <option value="wheat">Wheat</option>
                    </select>
                  </div>
                </div>

                {/* Warehouses List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Warehouse 1 */}
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="text-4xl">🏭</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">Central Valley Storage</h3>
                          <p className="text-sm text-muted-foreground">Certified Agricultural Warehouse</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Fresno, CA • 2.3 miles</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">4.9</span>
                          </div>
                          <span className="text-xs text-gray-500">50,000 sq ft capacity</span>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Accepts:</p>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">Rice</span>
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">Wheat</span>
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">Corn</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-gray-600">Available for storage</span>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => window.open('tel:+15551234567')}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => window.open('mailto:info@centralvalleystorage.com')}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Warehouse 2 */}
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="text-4xl">🏢</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">Golden State Grain Co.</h3>
                          <p className="text-sm text-muted-foreground">Premium Storage Facility</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Bakersfield, CA • 5.7 miles</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">4.8</span>
                          </div>
                          <span className="text-xs text-gray-500">75,000 sq ft capacity</span>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Accepts:</p>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">Soybeans</span>
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">Cotton</span>
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">Sugar</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span className="text-xs text-gray-600">Limited availability</span>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => window.open('tel:+15552345678')}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => window.open('mailto:storage@goldenstategrain.com')}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Warehouse 3 */}
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="text-4xl">🌾</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">Valley Harvest Storage</h3>
                          <p className="text-sm text-muted-foreground">Climate-Controlled Facility</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Modesto, CA • 8.1 miles</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">4.7</span>
                          </div>
                          <span className="text-xs text-gray-500">40,000 sq ft capacity</span>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Accepts:</p>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">All Grains</span>
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">Climate Control</span>
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">Organic</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <span className="text-xs text-gray-600">Book in advance</span>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => window.open('tel:+15553456789')}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => window.open('mailto:bookings@valleyharvest.com')}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Help Section */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MessageCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Storage Help?</h3>
                        <p className="text-blue-700 mb-4">
                          Can't find a suitable warehouse or need assistance with storage? Our support team is available 24/7.
                        </p>
                        <div className="flex space-x-3">
                          <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                            <Phone className="h-4 w-4 mr-2" />
                            Call Support: +1 (555) 000-HELP
                          </Button>
                          <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Live Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
