"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
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
  const [farmerId, setFarmerId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('farmerToken');
      const storedEmail = localStorage.getItem('farmerEmail');
      const storedFarmerId = localStorage.getItem('farmerId');

      if (token && storedEmail) {
        // Verify token is still valid by making a test request
        try {
          const response = await fetch('/api/farmers/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setFarmerName(data.farmer?.email?.split('@')[0] || storedEmail.split('@')[0]);
            setFarmerId(data.farmer?.id || (storedFarmerId ? parseInt(storedFarmerId) : 0));
            setIsLoggedIn(true);
          } else if (response.status === 404) {
            // Profile endpoint doesn't exist yet, just trust the token
            setFarmerName(storedEmail.split('@')[0]);
            setFarmerId(storedFarmerId ? parseInt(storedFarmerId) : 0);
            setIsLoggedIn(true);
          } else {
            // Token is actually invalid (401, 403, etc.), clear it
            localStorage.removeItem('farmerToken');
            localStorage.removeItem('farmerEmail');
            localStorage.removeItem('farmerId');
          }
        } catch (error) {
          // Network error or other issue, just trust the token
          setFarmerName(storedEmail.split('@')[0]);
          setFarmerId(storedFarmerId ? parseInt(storedFarmerId) : 0);
          setIsLoggedIn(true);
        }
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

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
        const name = data.farmer.email.split('@')[0];
        setFarmerName(name);
        setFarmerId(data.farmer.id);
        setIsLoggedIn(true);
        // Store token, email, and farmer ID for future sessions
        localStorage.setItem('farmerToken', data.token);
        localStorage.setItem('farmerEmail', data.farmer.email);
        localStorage.setItem('farmerId', data.farmer.id.toString());
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
    setFarmerId(0);
    setError("");
    // Clear stored credentials
    localStorage.removeItem('farmerToken');
    localStorage.removeItem('farmerEmail');
    localStorage.removeItem('farmerId');
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-agricultural-green/5 via-trust-blue/5 to-golden-accent/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not logged in
  if (!isLoggedIn) {
    return <FarmerLogin onLogin={handleLogin} isLoading={isLoading} error={error} />;
  }

  // Show dashboard if logged in
  return <FarmerDashboardNew farmerName={farmerName} farmerId={farmerId} onLogout={handleLogout} />;
}
