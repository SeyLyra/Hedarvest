"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { 
  Wheat, 
  DollarSign, 
  Users, 
  MapPin,
  CheckCircle,
  Phone,
  ArrowRight,
  Leaf,
  Tractor,
  Package,
  Clock,
  AlertCircle,
  Shield,
  Sparkles,
  Star,
  Zap,
  TrendingUp,
  Globe,
  Heart,
  Award,
  Target,
  Rocket,
  Sun,
  Moon,
  Cloud,
  Droplets,
  Wind,
  Sprout,
  TreePine,
  Carrot,
  Apple,
  Cherry,
  Grape,
  Coffee,
  Milk,
  Egg,
  Fish,
  Beef,
  PiggyBank,
  Banknote,
  Coins,
  CreditCard,
  Wallet,
  Receipt,
  Calculator,
  PieChart,
  BarChart3,
  LineChart,
  Activity,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  X,
  Check,
  AlertTriangle,
  Info,
  HelpCircle,
  MessageCircle,
  Mail,
  Send,
  Download,
  Upload,
  Share2,
  Copy,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  RotateCcw,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Diamond,
  Square as SquareIcon,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Hexagon as HexagonIcon,
  Octagon as OctagonIcon,
  Diamond as DiamondIcon,
  User
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface FarmerRegistrationForm {
  name: string;
  phoneNumber: string;
  address: string;
  cropType: string;
  collateralAmount: number;
}

export default function FarmerSolutionPage() {
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [showAgentMap, setShowAgentMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FarmerRegistrationForm>();

  const cropType = watch("cropType");
  const collateralAmount = watch("collateralAmount");

  // Fancy animations and effects
  useEffect(() => {
    setIsLoaded(true);
    
    // Set initial time on client side only
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Mock agent data for map
  const agents = [
    { id: 1, name: "Sarah Johnson", location: { lat: 40.7128, lng: -74.0060 }, distance: "2.3 km", phone: "+1-555-0123" },
    { id: 2, name: "Mike Chen", location: { lat: 40.7589, lng: -73.9851 }, distance: "4.1 km", phone: "+1-555-0124" },
    { id: 3, name: "Maria Garcia", location: { lat: 40.6892, lng: -74.0445 }, distance: "5.7 km", phone: "+1-555-0125" },
    { id: 4, name: "Ahmed Hassan", location: { lat: 40.7505, lng: -73.9934 }, distance: "3.2 km", phone: "+1-555-0126" },
    { id: 5, name: "Lisa Wang", location: { lat: 40.6782, lng: -73.9442 }, distance: "6.8 km", phone: "+1-555-0127" },
  ];

  const cropTypes = [
    { value: "rice", label: "Rice" },
    { value: "corn", label: "Corn" },
    { value: "wheat", label: "Wheat" }
  ];

  const onSubmit = async (data: FarmerRegistrationForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/farmer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Registration received. An agent will contact you shortly.");
        setRegistrationStatus("pending");
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestAgent = async () => {
    try {
      const response = await fetch('/api/farmer/request-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast.success("Agent request sent successfully!");
      } else {
        throw new Error('Request failed');
      }
    } catch (error) {
      toast.error("Failed to request agent. Please try again.");
    }
  };

  const getTokenPreview = () => {
    if (!collateralAmount || !cropType) return "0 tokens";
    return `${collateralAmount} tokens (${collateralAmount} kg ${cropType})`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-green-400/30 rounded-full animate-pulse" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-blue-400/30 rounded-full animate-pulse" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-1 h-1 bg-yellow-400/40 rounded-full animate-pulse" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        <div className="absolute top-60 right-1/3 w-2 h-2 bg-green-300/20 rounded-full animate-pulse" style={{animationDelay: '3s', animationDuration: '6s'}}></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-blue-300/20 rounded-full animate-pulse" style={{animationDelay: '4s', animationDuration: '7s'}}></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-green-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0s', animationDuration: '8s'}}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-green-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s', animationDuration: '10s'}}></div>
        
        {/* Mouse follower */}
        <div 
          className="absolute w-32 h-32 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-xl pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: mousePosition.x - 64,
            top: mousePosition.y - 64,
            transform: 'translateZ(0)'
          }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl sticky top-0 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="Hedarvest Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Hedarvest
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}</span>
              </div>
              <Button variant="outline" size="sm" asChild className="group hover:scale-105 transition-transform">
                <a href="/" className="flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Back to Home</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Hero Section */}
          <section className={`text-center mb-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-12">
              {/* Animated Icon */}
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group hover:scale-110 transition-all duration-500 overflow-hidden">
                  <img 
                    src="/logo.png" 
                    alt="Hedarvest Logo" 
                    className="w-20 h-20 object-contain group-hover:rotate-12 transition-transform duration-300"
                  />
                </div>
                {/* Floating sparkles around icon */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center animate-bounce" style={{animationDelay: '0.5s'}}>
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-1/2 -right-4 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 -left-4 w-4 h-4 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>

              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                  Get Cash for Your Crops
                </span>
              </h1>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
                Turn your harvest into instant cash without selling early. 
                <span className="text-green-600 font-semibold"> No wallet, no crypto knowledge needed.</span>
              </p>

              {/* Animated stats */}
              <div className="flex flex-wrap justify-center gap-8 mb-12">
                <div className="text-center group">
                  <div className="text-4xl font-bold text-green-600 group-hover:scale-110 transition-transform">$2.4M+</div>
                  <div className="text-sm text-gray-600">Total Value Locked</div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl font-bold text-blue-600 group-hover:scale-110 transition-transform">8.2%</div>
                  <div className="text-sm text-gray-600">Average APY</div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl font-bold text-purple-600 group-hover:scale-110 transition-transform">2,500+</div>
                  <div className="text-sm text-gray-600">Active Farmers</div>
                </div>
              </div>
            </div>

            {/* Hero Explanation Card */}
            <Card className="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-2 border-green-200/50 shadow-2xl group hover:shadow-3xl transition-all duration-500">
              <CardContent className="p-10">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                      How It Works
                      <Sparkles className="w-6 h-6 text-yellow-500 ml-2 animate-spin" />
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Deposit your crops as collateral <span className="font-semibold text-green-600">(1 kg = 1 token)</span>. A local agent will verify 
                      and help you access financing. <span className="font-semibold text-blue-600">No wallet, no crypto knowledge needed.</span>
                    </p>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Same-day verification</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-blue-600">
                        <Shield className="w-4 h-4" />
                        <span>Secure storage</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-purple-600">
                        <Zap className="w-4 h-4" />
                        <span>Instant cash</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Farmer Registration Form */}
          <section className={`mb-16 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Card className="max-w-4xl mx-auto bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 border-2 border-green-200/50 shadow-2xl group hover:shadow-3xl transition-all duration-500">
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Register as a Farmer
                  </CardTitle>
                </div>
                <CardDescription className="text-lg text-gray-600">
                  Fill out the form below and we'll connect you with a local agent
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                        <User className="w-5 h-5 text-green-600" />
                        <span>Full Name</span>
                      </Label>
                      <Input
                        id="name"
                        {...register("name", { required: "Name is required" })}
                        placeholder="Enter your full name"
                        className="h-14 text-lg border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-200 rounded-xl transition-all duration-300"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.name.message}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="phoneNumber" className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                        <Phone className="w-5 h-5 text-blue-600" />
                        <span>Phone Number</span>
                      </Label>
                      <Input
                        id="phoneNumber"
                        {...register("phoneNumber", { 
                          required: "Phone number is required",
                          pattern: {
                            value: /^[\+]?[1-9][\d]{0,15}$/,
                            message: "Please enter a valid phone number"
                          }
                        })}
                        placeholder="+1 (555) 123-4567"
                        className="h-14 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 rounded-xl transition-all duration-300"
                      />
                      {errors.phoneNumber && (
                        <p className="text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.phoneNumber.message}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="address" className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <span>Address</span>
                    </Label>
                    <Input
                      id="address"
                      {...register("address", { required: "Address is required" })}
                      placeholder="Enter your full address"
                      className="h-14 text-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 rounded-xl transition-all duration-300"
                    />
                    {errors.address && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.address.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="cropType" className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                      <Wheat className="w-5 h-5 text-yellow-600" />
                      <span>Crop Type</span>
                    </Label>
                    <select 
                      {...register("cropType", { required: "Crop type is required" })}
                      className="w-full h-14 text-lg px-4 py-3 border-2 border-gray-200 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 rounded-xl transition-all duration-300 bg-white"
                    >
                      <option value="">Select your crop type</option>
                      {cropTypes.map((crop) => (
                        <option key={crop.value} value={crop.value}>
                          {crop.label}
                        </option>
                      ))}
                    </select>
                    {errors.cropType && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.cropType.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="collateralAmount" className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      <span>Collateral Amount (kg)</span>
                    </Label>
                    <Input
                      id="collateralAmount"
                      type="number"
                      step="0.1"
                      {...register("collateralAmount", { 
                        required: "Collateral amount is required",
                        min: { value: 1, message: "Minimum 1 kg required" }
                      })}
                      placeholder="1000"
                      className="h-14 text-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 rounded-xl transition-all duration-300"
                    />
                    {errors.collateralAmount && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.collateralAmount.message}</span>
                      </p>
                    )}
                    
                    {/* Token Preview */}
                    {collateralAmount && cropType && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 rounded-xl border-2 border-green-200 shadow-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <Coins className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">You'll receive:</p>
                            <p className="text-lg font-bold text-green-600">
                              {getTokenPreview()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 group"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-6 h-6 mr-3 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                        <span>Register & Connect with Agent</span>
                        <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Agent Finder Section */}
          <section className={`mb-16 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Card className="bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 border-2 border-blue-200/50 shadow-2xl group hover:shadow-3xl transition-all duration-500">
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    Find Local Agents
                  </CardTitle>
                </div>
                <CardDescription className="text-lg text-gray-600">
                  Connect with verified agents in your area
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Interactive Map Placeholder */}
                  <div className="relative h-80 bg-gradient-to-br from-blue-100 via-green-100 to-purple-100 rounded-2xl border-2 border-dashed border-blue-300 flex items-center justify-center group hover:border-blue-400 transition-colors">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <MapPin className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-gray-700 mb-2">Interactive Map</p>
                      <p className="text-sm text-gray-600">Agent locations will be shown here</p>
                      <div className="mt-4 flex justify-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Agent List */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                      <Users className="w-6 h-6 text-blue-600" />
                      <span>Nearby Agents</span>
                    </h3>
                    {agents.slice(0, 3).map((agent, index) => (
                      <div key={agent.id} className={`group p-6 bg-gradient-to-r from-white to-blue-50/50 border-2 border-blue-100 rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 ${index === 0 ? 'ring-2 ring-green-400 ring-opacity-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${index === 0 ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>
                              <Users className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-800">{agent.name}</p>
                              <p className="text-sm text-gray-600 flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{agent.distance} away</span>
                              </p>
                              {index === 0 && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-xs font-semibold text-yellow-600">Recommended</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button size="sm" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl group-hover:scale-105 transition-transform">
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center mt-8">
                  <Button 
                    onClick={requestAgent}
                    className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 hover:from-blue-600 hover:via-green-600 hover:to-purple-600 text-white rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 group"
                  >
                    <Rocket className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                    <span>Request Agent</span>
                    <Sparkles className="w-6 h-6 ml-3 group-hover:animate-spin" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Status Section */}
          {registrationStatus && (
            <section className={`mb-16 transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Card className="max-w-4xl mx-auto bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/30 border-2 border-yellow-200/50 shadow-2xl group hover:shadow-3xl transition-all duration-500">
                <CardHeader className="text-center pb-8">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      Registration Status
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        {registrationStatus === "pending" ? (
                          <Clock className="w-12 h-12 text-orange-500 animate-pulse" />
                        ) : registrationStatus === "assigned" ? (
                          <CheckCircle className="w-12 h-12 text-green-500" />
                        ) : (
                          <AlertCircle className="w-12 h-12 text-red-500" />
                        )}
                      </div>
                      {/* Animated ring */}
                      <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping"></div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">
                        {registrationStatus === "pending" && "Pending Verification"}
                        {registrationStatus === "assigned" && "Agent Assigned"}
                        {registrationStatus === "active" && "Loan Active"}
                      </h3>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {registrationStatus === "pending" && "Your registration is being reviewed. An agent will contact you shortly."}
                        {registrationStatus === "assigned" && "Your agent has been assigned and will contact you within 24 hours."}
                        {registrationStatus === "active" && "Your loan is now active. Check your dashboard for details."}
                      </p>
                    </div>

                    {registrationStatus === "pending" && (
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-6 max-w-md mx-auto">
                        <div className="flex items-center justify-center space-x-3">
                          <Clock className="w-6 h-6 text-orange-500 animate-pulse" />
                          <span className="text-lg font-semibold text-orange-800">
                            Expected response time: 2-4 hours
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Features Section */}
          <section className={`mb-16 transition-all duration-1000 delay-900 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Why Choose HedArvest?
                </span>
              </h2>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
                Simple, secure, and farmer-friendly financing
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="group text-center p-8 bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 border-2 border-green-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-500">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Same-Day Cash</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Get cash advances the same day your crops are verified
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full group-hover:w-20 transition-all duration-300"></div>
                </div>
              </Card>

              <Card className="group text-center p-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-blue-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-500">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">No Crypto Needed</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Work with local agents - no wallet or blockchain knowledge required
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:w-20 transition-all duration-300"></div>
                </div>
              </Card>

              <Card className="group text-center p-8 bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/30 border-2 border-yellow-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-500">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Wheat className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Fair Prices</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Get market rates for your crops without selling early
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="w-12 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full group-hover:w-20 transition-all duration-300"></div>
                </div>
              </Card>
            </div>
          </section>

          {/* Floating Action Button */}
          <div className="fixed bottom-8 right-8 z-50">
            <Button 
              size="lg" 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 group"
            >
              <MessageCircle className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
