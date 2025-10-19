"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import FarmerLogin from "@/components/farmer/FarmerLogin";
import FarmerDashboardNew from "@/components/farmer/FarmerDashboardNew";
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [farmerName, setFarmerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/farmers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setFarmerName(data.farmer.email.split('@')[0]); // Use email prefix as name
        setIsLoggedIn(true);
        // Store token for future API calls
        localStorage.setItem('farmerToken', data.token);
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setFarmerName("");
    setError("");
  };

  // Show login form if not logged in
  if (!isLoggedIn) {
    return <FarmerLogin onLogin={handleLogin} isLoading={isLoading} error={error} />;
  }

  // Show dashboard if logged in
  if (isLoggedIn) {
    return <FarmerDashboardNew farmerName={farmerName} onLogout={handleLogout} />;
  }

  // This return statement should never be reached due to the conditional returns above
  return null;
}
