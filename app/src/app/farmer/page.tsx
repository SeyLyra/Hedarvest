"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  Wheat, 
  DollarSign, 
  Clock, 
  Users, 
  ArrowRight,
  Shield,
  Zap,
  Truck,
  HandHeart,
  MessageCircle,
  Phone,
  CheckCircle,
  Star,
  MapPin,
  Search
} from "lucide-react";

export default function FarmerPage() {
  const [showMap, setShowMap] = useState(false);

  // Mock agent data
  const agents = [
    { id: 1, name: "John Smith", specialty: "Crop Loans", rating: 4.9, distance: "2.3 km", location: { lat: 40.7128, lng: -74.0060 } },
    { id: 2, name: "Maria Garcia", specialty: "Equipment Finance", rating: 4.8, distance: "4.1 km", location: { lat: 40.7589, lng: -73.9851 } },
    { id: 3, name: "Ahmed Hassan", specialty: "Seasonal Loans", rating: 4.7, distance: "5.7 km", location: { lat: 40.6892, lng: -74.0445 } },
    { id: 4, name: "Sarah Johnson", specialty: "Land Purchase", rating: 4.9, distance: "3.2 km", location: { lat: 40.7505, lng: -73.9934 } },
    { id: 5, name: "Chen Wei", specialty: "Export Finance", rating: 4.6, distance: "6.8 km", location: { lat: 40.6782, lng: -73.9442 } },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-agricultural-green/5 via-transparent to-golden-accent/5"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-6 py-3 rounded-full bg-agricultural-green/10 text-agricultural-green text-sm font-semibold border border-agricultural-green/20">
                🌾 For Farmers
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-8 leading-tight">
              Turn your crops into cash,<br />
              <span className="bg-gradient-to-r from-agricultural-green to-golden-accent bg-clip-text text-transparent">
                without selling early
              </span>
            </h1>
            
            <p className="text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              HedArvest lets you use your harvest as collateral to get instant loans. 
              No more waiting for harvest season to access your money.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-agricultural-green to-trust-blue hover:from-agricultural-green/90 hover:to-trust-blue/90 text-white text-xl px-10 py-6 rounded-full shadow-card hover:shadow-xl transition-all duration-300"
              >
                <Users className="mr-3 h-6 w-6" />
                Talk to an Agent
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-trust-blue to-golden-accent hover:from-trust-blue/90 hover:to-golden-accent/90 text-white text-xl px-10 py-6 rounded-full shadow-card hover:shadow-xl transition-all duration-300"
                onClick={() => setShowMap(true)}
              >
                <Search className="mr-3 h-6 w-6" />
                Find Nearby Agents
                <MapPin className="ml-3 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-xl px-10 py-6 rounded-full border-2 border-agricultural-green/30 text-agricultural-green hover:bg-agricultural-green/5"
              >
                Learn More
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-agricultural-green" />
                <span>Same-day cash advances</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-trust-blue" />
                <span>Blockchain verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-golden-accent" />
                <span>Fair market prices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-agricultural-green to-trust-blue bg-clip-text text-transparent">
                HedArvest?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of farmers who are already using HedArvest to access their money when they need it most.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Card className="group text-center p-10 bg-card rounded-3xl shadow-card border border-border/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <CardContent className="p-0">
                <div className="w-20 h-20 bg-gradient-to-r from-agricultural-green to-golden-accent rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-6">Fast Cash</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  No more waiting until harvest. Access money when you need it, 
                  with same-day approval and instant transfers.
                </p>
              </CardContent>
            </Card>

            <Card className="group text-center p-10 bg-card rounded-3xl shadow-card border border-border/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <CardContent className="p-0">
                <div className="w-20 h-20 bg-gradient-to-r from-trust-blue to-agricultural-green rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-6">Fair Terms</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  No more loan sharks. Transparent, low-cost loans with 
                  competitive interest rates and no hidden fees.
                </p>
              </CardContent>
            </Card>

            <Card className="group text-center p-10 bg-card rounded-3xl shadow-card border border-border/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <CardContent className="p-0">
                <div className="w-20 h-20 bg-gradient-to-r from-golden-accent to-trust-blue rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Wheat className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-6">Keep Your Crops</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  You don't need to sell early at low prices. Your crops stay 
                  safely stored while you access their value.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-trust-blue/5 via-agricultural-green/5 to-golden-accent/5">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              How It{" "}
              <span className="bg-gradient-to-r from-trust-blue to-agricultural-green bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent process that puts you in control of your finances.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="bg-gradient-to-r from-agricultural-green to-golden-accent w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-card group-hover:scale-110 transition-transform duration-300">
                    <Truck className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-agricultural-green text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    1
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Deliver Crops</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Bring your crops to a local storage partner for verification and safe storage.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="bg-gradient-to-r from-trust-blue to-agricultural-green w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-card group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-trust-blue text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    2
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Get Instant Cash</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Get up to 80% of your crops' value in cash immediately to your account.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="bg-gradient-to-r from-golden-accent to-trust-blue w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-card group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-golden-accent text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    3
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Repay & Reclaim</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Repay the loan and get your crops back, or sell them at market price.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Support Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-trust-blue/10 via-agricultural-green/5 to-golden-accent/10 p-12 rounded-3xl border border-border/50 shadow-card">
              <div className="text-center mb-12">
                <div className="bg-gradient-to-r from-trust-blue to-agricultural-green w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <HandHeart className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  We're Here to Help
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  You don't need to know crypto or apps. Our local agents guide you through 
                  every step of the process, from registration to getting your first loan.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="flex items-center p-6 bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-lg transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-trust-blue to-agricultural-green w-16 h-16 rounded-2xl flex items-center justify-center mr-6">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">SMS Registration</h3>
                    <p className="text-muted-foreground">Simple signup via text message - no smartphone required</p>
                  </div>
                </div>
                
                <div className="flex items-center p-6 bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-lg transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-agricultural-green to-golden-accent w-16 h-16 rounded-2xl flex items-center justify-center mr-6">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Phone Support</h3>
                    <p className="text-muted-foreground">24/7 support in your local language</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Now CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-trust-blue to-agricultural-green relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-trust-blue/90 to-agricultural-green/90"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Ready to Get Started?
            </h2>
            <p className="text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of farmers who are already using HedArvest to access their money when they need it most.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button 
                size="lg" 
                className="bg-white text-trust-blue hover:bg-white/90 text-xl px-12 py-6 rounded-full shadow-card hover:shadow-xl transition-all duration-300"
              >
                <Users className="mr-3 h-6 w-6" />
                Find Your Local Agent
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-xl px-12 py-6 rounded-full border-2 border-white/30 text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">2,500+</div>
                <div className="text-white/80">Active Farmers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">$12M+</div>
                <div className="text-white/80">Loans Disbursed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">98%</div>
                <div className="text-white/80">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-foreground">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">HedArvest</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Empowering farmers with fair financial access through blockchain technology. 
              Built on Hedera Network for transparency and security.
            </p>
          </div>
          <div className="border-t border-border/50 pt-8">
            <p className="text-muted-foreground">
              © 2024 HedArvest. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Find Nearby Agents</h2>
                <p className="text-muted-foreground mt-2">Connect with HedArvest agents in your area</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowMap(false)}
                className="rounded-full"
              >
                ✕
              </Button>
            </div>

            {/* Map Content */}
            <div className="flex h-[70vh]">
              {/* Map Area */}
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden">
                {/* Map-like Background with Roads */}
                <div className="absolute inset-0">
                  {/* Main roads */}
                  <div className="absolute top-1/3 left-0 w-full h-1 bg-gray-400 opacity-60"></div>
                  <div className="absolute top-2/3 left-0 w-full h-1 bg-gray-400 opacity-60"></div>
                  <div className="absolute top-0 left-1/3 w-1 h-full bg-gray-400 opacity-60"></div>
                  <div className="absolute top-0 left-2/3 w-1 h-full bg-gray-400 opacity-60"></div>
                  
                  {/* Secondary roads */}
                  <div className="absolute top-1/6 left-0 w-full h-0.5 bg-gray-300 opacity-40"></div>
                  <div className="absolute top-5/6 left-0 w-full h-0.5 bg-gray-300 opacity-40"></div>
                  <div className="absolute top-0 left-1/6 w-0.5 h-full bg-gray-300 opacity-40"></div>
                  <div className="absolute top-0 left-5/6 w-0.5 h-full bg-gray-300 opacity-40"></div>
                </div>

                {/* Buildings/Areas */}
                <div className="absolute top-4 left-4 w-16 h-12 bg-gray-600 rounded opacity-70"></div>
                <div className="absolute top-4 right-4 w-20 h-10 bg-gray-600 rounded opacity-70"></div>
                <div className="absolute bottom-4 left-4 w-14 h-16 bg-gray-600 rounded opacity-70"></div>
                <div className="absolute bottom-4 right-4 w-18 h-12 bg-gray-600 rounded opacity-70"></div>
                
                {/* Green areas (parks/farms) */}
                <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-green-400 rounded-full opacity-50"></div>
                <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-green-300 rounded-full opacity-50"></div>

                {/* Agent Markers */}
                {agents.map((agent, index) => (
                  <div 
                    key={agent.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{
                      left: `${15 + (index * 18)}%`,
                      top: `${25 + (index * 12)}%`
                    }}
                  >
                    <div className="bg-gradient-to-r from-trust-blue to-agricultural-green w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-white">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 min-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-foreground">{agent.name}</h4>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-muted-foreground">{agent.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{agent.specialty}</p>
                      <p className="text-sm text-agricultural-green font-semibold">{agent.distance}</p>
                    </div>
                  </div>
                ))}

                {/* Center Marker (Current Location) */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Agents List */}
              <div className="w-96 bg-gray-50 overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Nearby Agents</h3>
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div key={agent.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-foreground">{agent.name}</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-muted-foreground">{agent.rating}</span>
                            </div>
                            <span className="text-sm text-agricultural-green font-semibold">{agent.distance}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{agent.specialty}</p>
                        <Button size="sm" className="w-full bg-gradient-to-r from-agricultural-green to-trust-blue text-white">
                          Contact Agent
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
