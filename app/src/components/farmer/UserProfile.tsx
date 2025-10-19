"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Wallet, 
  Settings, 
  Edit, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Bell,
  Lock,
  Key,
  Eye,
  EyeOff,
  Camera,
  Upload,
  Download,
  ExternalLink,
  Info
} from "lucide-react";

interface FarmerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  dateOfBirth: string;
  registrationDate: string;
  kycStatus: "verified" | "pending" | "rejected";
  walletAddress: string;
  preferredLanguage: string;
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  securitySettings: {
    twoFactor: boolean;
    biometric: boolean;
  };
  farmingDetails: {
    farmSize: string;
    primaryCrops: string[];
    experience: string;
    certifications: string[];
  };
  avatar?: string;
}

const mockProfile: FarmerProfile = {
  id: "farmer_001",
  name: "John Smith",
  email: "john.smith@example.com",
  phone: "+1 (555) 123-4567",
  address: "123 Farm Road",
  city: "Agricultural City",
  state: "Farm State",
  country: "United States",
  dateOfBirth: "1985-03-15",
  registrationDate: "2023-01-15",
  kycStatus: "verified",
  walletAddress: "0x742d...8a9c",
  preferredLanguage: "English",
  notificationSettings: {
    email: true,
    sms: true,
    push: false
  },
  securitySettings: {
    twoFactor: true,
    biometric: false
  },
  farmingDetails: {
    farmSize: "50 acres",
    primaryCrops: ["Rice", "Corn", "Wheat"],
    experience: "15 years",
    certifications: ["Organic Certified", "GAP Certified"]
  }
};

export default function UserProfile() {
  const [profile, setProfile] = useState<FarmerProfile>(mockProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<FarmerProfile>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "security" | "farming" | "preferences">("personal");

  const handleEdit = () => {
    setEditData(profile);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfile(prev => ({ ...prev, ...editData }));
    setIsEditing(false);
    setEditData({});
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "text-green-600 bg-green-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "rejected": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      {/* Avatar and Basic Info */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          {isEditing && (
            <Button
              size="sm"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              onClick={() => {/* Handle avatar upload */}}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>
        <h2 className="text-2xl font-bold text-foreground mt-4">{profile.name}</h2>
        <p className="text-muted-foreground">Farmer since {new Date(profile.registrationDate).getFullYear()}</p>
        <Badge className={getKycStatusColor(profile.kycStatus)}>
          {profile.kycStatus.toUpperCase()}
        </Badge>
      </div>

      {/* Personal Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          {isEditing ? (
            <Input
              id="name"
              value={editData.name || profile.name}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
            />
          ) : (
            <p className="text-foreground">{profile.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          {isEditing ? (
            <Input
              id="email"
              type="email"
              value={editData.email || profile.email}
              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
            />
          ) : (
            <p className="text-foreground">{profile.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          {isEditing ? (
            <Input
              id="phone"
              value={editData.phone || profile.phone}
              onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
            />
          ) : (
            <p className="text-foreground">{profile.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          {isEditing ? (
            <Input
              id="dateOfBirth"
              type="date"
              value={editData.dateOfBirth || profile.dateOfBirth}
              onChange={(e) => setEditData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            />
          ) : (
            <p className="text-foreground">{new Date(profile.dateOfBirth).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            {isEditing ? (
              <Input
                id="address"
                value={editData.address || profile.address}
                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
              />
            ) : (
              <p className="text-foreground">{profile.address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            {isEditing ? (
              <Input
                id="city"
                value={editData.city || profile.city}
                onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
              />
            ) : (
              <p className="text-foreground">{profile.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            {isEditing ? (
              <Input
                id="state"
                value={editData.state || profile.state}
                onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
              />
            ) : (
              <p className="text-foreground">{profile.state}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityInfo = () => (
    <div className="space-y-6">
      {/* Wallet Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Wallet Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={profile.walletAddress}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Private Key
            </Button>
            <Button variant="outline" size="sm">
              <Key className="h-4 w-4 mr-2" />
              Change Wallet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant={profile.securitySettings.twoFactor ? "default" : "outline"}>
              {profile.securitySettings.twoFactor ? "Enabled" : "Enable"}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Biometric Authentication</h4>
              <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
            </div>
            <Button variant={profile.securitySettings.biometric ? "default" : "outline"}>
              {profile.securitySettings.biometric ? "Enabled" : "Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
            />
          </div>
          
          <Button className="w-full">
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderFarmingInfo = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Farming Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Farm Size</Label>
              <p className="text-foreground">{profile.farmingDetails.farmSize}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Experience</Label>
              <p className="text-foreground">{profile.farmingDetails.experience}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Primary Crops</Label>
            <div className="flex flex-wrap gap-2">
              {profile.farmingDetails.primaryCrops.map((crop) => (
                <Badge key={crop} variant="outline">
                  {crop}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Certifications</Label>
            <div className="flex flex-wrap gap-2">
              {profile.farmingDetails.certifications.map((cert) => (
                <Badge key={cert} className="text-green-600 bg-green-100">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium text-foreground">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <Button variant={profile.notificationSettings.email ? "default" : "outline"}>
              {profile.notificationSettings.email ? "Enabled" : "Disabled"}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium text-foreground">SMS Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
              </div>
            </div>
            <Button variant={profile.notificationSettings.sms ? "default" : "outline"}>
              {profile.notificationSettings.sms ? "Enabled" : "Disabled"}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium text-foreground">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive push notifications</p>
              </div>
            </div>
            <Button variant={profile.notificationSettings.push ? "default" : "outline"}>
              {profile.notificationSettings.push ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <select
              id="language"
              value={profile.preferredLanguage}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "farming", label: "Farming", icon: User },
    { id: "preferences", label: "Preferences", icon: Settings }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
            <User className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">User Profile</h2>
        <p className="text-lg text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {tabs.find(t => t.id === activeTab)?.label}
            </CardTitle>
            {activeTab === "personal" && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "personal" && renderPersonalInfo()}
          {activeTab === "security" && renderSecurityInfo()}
          {activeTab === "farming" && renderFarmingInfo()}
          {activeTab === "preferences" && renderPreferences()}
        </CardContent>
      </Card>
    </div>
  );
}
