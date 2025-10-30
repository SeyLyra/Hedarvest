"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Warehouse } from "lucide-react";
import WarehouseDashboard from "@/components/warehouse/WarehouseDashboard";
import { BACKEND_URL } from "@/lib/config";

interface WarehouseLoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

function WarehouseLogin({ onLogin, isLoading = false, error }: WarehouseLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-green-600 to-amber-600 rounded-2xl flex items-center justify-center">
            <Warehouse className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Warehouse Login
          </h1>
          <p className="text-muted-foreground mt-2">
            Access your warehouse operations dashboard
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
              className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-700 hover:to-amber-700 text-white font-semibold"
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
          
          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-800 mb-2">Demo Credentials</h4>
            <div className="space-y-1 text-xs text-green-700">
              <p><strong>Email:</strong> operator@warehouse.com</p>
              <p><strong>Password:</strong> password</p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button variant="link" className="p-0 h-auto text-green-600 hover:text-amber-600">
                Contact system administrator
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WarehousePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [operatorName, setOperatorName] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('warehouseToken');
      const savedOperatorName = localStorage.getItem('warehouseOperatorName');
      const savedWarehouseId = localStorage.getItem('warehouseId');

      if (token && savedOperatorName && savedWarehouseId) {
        // Verify token is still valid by making a test request
        try {
          const response = await fetch(`${BACKEND_URL}/warehouse/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setOperatorName(savedOperatorName);
            setWarehouseId(savedWarehouseId);
            setIsLoggedIn(true);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('warehouseToken');
            localStorage.removeItem('warehouseOperatorName');
            localStorage.removeItem('warehouseId');
          }
        } catch (error) {
          // Network error, just trust the token
          setOperatorName(savedOperatorName);
          setWarehouseId(savedWarehouseId);
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
      const response = await fetch(`${BACKEND_URL}/warehouse/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const operator = data.warehouse.operator;
        const whId = data.warehouse.id;

        setOperatorName(operator);
        setWarehouseId(whId);
        setIsLoggedIn(true);

        // Persist to localStorage
        localStorage.setItem('warehouseToken', data.accessToken);
        localStorage.setItem('warehouseOperatorName', operator);
        localStorage.setItem('warehouseId', whId);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setOperatorName("");
    setWarehouseId("");
    setError("");

    // Clear all session data
    localStorage.removeItem('warehouseToken');
    localStorage.removeItem('warehouseOperatorName');
    localStorage.removeItem('warehouseId');
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/30 via-amber-50/30 to-green-50/30">
        <div className="text-center">
          <div className="relative mb-6">
            {/* Outer spinning ring */}
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-400/20 border-t-green-400 mx-auto"></div>
            {/* Inner warehouse icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-green-400 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-green-600">Checking Authentication</p>
            <p className="text-sm text-muted-foreground">Please wait while we verify your credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login form if not logged in
  if (!isLoggedIn) {
    return <WarehouseLogin onLogin={handleLogin} isLoading={isLoading} error={error} />;
  }

  // Show dashboard if logged in
  if (isLoggedIn) {
    return (
      <WarehouseDashboard 
        operatorName={operatorName} 
        warehouseId={warehouseId}
        onLogout={handleLogout} 
      />
    );
  }

  return null;
}
