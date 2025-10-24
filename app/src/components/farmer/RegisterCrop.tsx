"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Camera, 
  MapPin, 
  Calendar, 
  Scale, 
  Droplets, 
  Thermometer, 
  Sun, 
  Wind, 
  Leaf, 
  Sprout, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Info,
  FileText,
  Image,
  X
} from "lucide-react";

interface RegisterCropProps {
  onBack: () => void;
  onNext: () => void;
}

interface CropData {
  type: string;
  variety: string;
  quantity: string;
  unit: string;
  harvestDate: string;
  location: string;
  grade: string;
  moisture: string;
  temperature: string;
  quality: string;
  notes: string;
  photos: File[];
}

const cropTypes = [
  { value: "rice", label: "Rice", icon: "🌾" },
  { value: "corn", label: "Corn", icon: "🌽" },
  { value: "wheat", label: "Wheat", icon: "🌾" },
  { value: "soybean", label: "Soybean", icon: "🫘" },
  { value: "cotton", label: "Cotton", icon: "🌿" },
  { value: "sugarcane", label: "Sugar Cane", icon: "🍯" },
  { value: "potato", label: "Potato", icon: "🥔" },
  { value: "tomato", label: "Tomato", icon: "🍅" }
];

const qualityGrades = [
  { value: "premium", label: "Premium", description: "Highest quality, excellent condition" },
  { value: "grade-a", label: "Grade A", description: "High quality, good condition" },
  { value: "grade-b", label: "Grade B", description: "Standard quality, acceptable condition" },
  { value: "grade-c", label: "Grade C", description: "Lower quality, basic condition" }
];

export default function RegisterCrop({ onBack, onNext }: RegisterCropProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [cropData, setCropData] = useState<CropData>({
    type: "",
    variety: "",
    quantity: "",
    unit: "kg",
    harvestDate: "",
    location: "",
    grade: "",
    moisture: "",
    temperature: "",
    quality: "",
    notes: "",
    photos: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, title: "Crop Details", description: "Basic information about your crop" },
    { id: 2, title: "Quality & Measurements", description: "Grade, moisture, and quality metrics" },
    { id: 3, title: "Location & Photos", description: "Harvest location and visual documentation" },
    { id: 4, title: "Review & Submit", description: "Review all information before submission" }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!cropData.type) newErrors.type = "Crop type is required";
        if (!cropData.variety) newErrors.variety = "Variety is required";
        if (!cropData.quantity) newErrors.quantity = "Quantity is required";
        if (!cropData.harvestDate) newErrors.harvestDate = "Harvest date is required";
        break;
      case 2:
        if (!cropData.grade) newErrors.grade = "Quality grade is required";
        if (!cropData.moisture) newErrors.moisture = "Moisture content is required";
        if (!cropData.temperature) newErrors.temperature = "Storage temperature is required";
        break;
      case 3:
        if (!cropData.location) newErrors.location = "Location is required";
        if (cropData.photos.length === 0) newErrors.photos = "At least one photo is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    console.log("Submitting crop registration:", cropData);

    try {
      // Get farmer ID from localStorage or context
      const farmerData = localStorage.getItem('farmer');
      if (!farmerData) {
        alert("Please login first");
        return;
      }

      const farmer = JSON.parse(farmerData);
      const token = localStorage.getItem('token');

      // Upload photos (in a real app, you'd upload to cloud storage)
      // For now, we'll just send empty array or convert to base64 if needed
      const photoUrls: string[] = [];

      // Create delivery request
      const response = await fetch('http://localhost:4000/warehouse/delivery-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          farmerId: farmer.id,
          warehouseId: 'WH001', // This should come from FindWarehouse component
          cropType: cropData.type,
          variety: cropData.variety,
          estimatedWeight: parseFloat(cropData.quantity),
          unit: cropData.unit,
          estimatedGrade: cropData.grade,
          moistureContent: cropData.moisture ? parseFloat(cropData.moisture) : undefined,
          temperature: cropData.temperature ? parseFloat(cropData.temperature) : undefined,
          scheduledDate: cropData.harvestDate,
          location: cropData.location,
          notes: cropData.notes,
          photos: photoUrls
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit delivery request');
      }

      const result = await response.json();
      console.log('Delivery request created:', result);

      alert(`Crop registration submitted successfully! Delivery request ID: ${result.id}\n\nYou can now find a warehouse to deliver your crops.`);
      onNext();
    } catch (error) {
      console.error('Error submitting crop registration:', error);
      alert('Failed to submit crop registration. Please try again.');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setCropData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };

  const removePhoto = (index: number) => {
    setCropData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cropType">Crop Type *</Label>
                <Select onValueChange={(value) => setCropData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cropTypes.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value}>
                        <div className="flex items-center space-x-2">
                          <span>{crop.icon}</span>
                          <span>{crop.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="variety">Variety *</Label>
                <Input
                  id="variety"
                  placeholder="e.g., Basmati, Golden Corn, etc."
                  value={cropData.variety}
                  onChange={(e) => setCropData(prev => ({ ...prev, variety: e.target.value }))}
                />
                {errors.variety && <p className="text-sm text-red-600">{errors.variety}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={cropData.quantity}
                    onChange={(e) => setCropData(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                  <Select onValueChange={(value) => setCropData(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder={cropData.unit || "Select unit"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="tons">tons</SelectItem>
                      <SelectItem value="quintals">quintals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.quantity && <p className="text-sm text-red-600">{errors.quantity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="harvestDate">Harvest Date *</Label>
                <Input
                  id="harvestDate"
                  type="date"
                  value={cropData.harvestDate}
                  onChange={(e) => setCropData(prev => ({ ...prev, harvestDate: e.target.value }))}
                />
                {errors.harvestDate && <p className="text-sm text-red-600">{errors.harvestDate}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="grade">Quality Grade *</Label>
              <Select onValueChange={(value) => setCropData(prev => ({ ...prev, grade: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quality grade" />
                </SelectTrigger>
                <SelectContent>
                  {qualityGrades.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      <div>
                        <div className="font-medium">{grade.label}</div>
                        <div className="text-sm text-muted-foreground">{grade.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade && <p className="text-sm text-red-600">{errors.grade}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="moisture">Moisture Content (%) *</Label>
                <div className="relative">
                  <Droplets className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="moisture"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 12.5"
                    value={cropData.moisture}
                    onChange={(e) => setCropData(prev => ({ ...prev, moisture: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                {errors.moisture && <p className="text-sm text-red-600">{errors.moisture}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Storage Temperature (°C) *</Label>
                <div className="relative">
                  <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 25.0"
                    value={cropData.temperature}
                    onChange={(e) => setCropData(prev => ({ ...prev, temperature: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                {errors.temperature && <p className="text-sm text-red-600">{errors.temperature}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Additional Quality Notes</Label>
              <Textarea
                id="quality"
                placeholder="Describe any special characteristics, storage conditions, or quality observations..."
                value={cropData.quality}
                onChange={(e) => setCropData(prev => ({ ...prev, quality: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="location">Harvest Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Enter farm location or address"
                  value={cropData.location}
                  onChange={(e) => setCropData(prev => ({ ...prev, location: e.target.value }))}
                  className="pl-10"
                />
              </div>
              {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
            </div>

            <div className="space-y-4">
              <Label>Upload Photos *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">Upload crop photos</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Take clear photos of your harvested crops for verification
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <Button asChild>
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Photos
                  </label>
                </Button>
              </div>
              {errors.photos && <p className="text-sm text-red-600">{errors.photos}</p>}

              {/* Photo Preview */}
              {cropData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {cropData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Crop photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about your harvest..."
                value={cropData.notes}
                onChange={(e) => setCropData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center py-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Review Your Information</h3>
              <p className="text-muted-foreground">
                Please review all details before submitting your crop registration
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Crop Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">
                      {cropTypes.find(c => c.value === cropData.type)?.icon} {cropTypes.find(c => c.value === cropData.type)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variety:</span>
                    <span className="font-medium">{cropData.variety}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{cropData.quantity} {cropData.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harvest Date:</span>
                    <span className="font-medium">{cropData.harvestDate}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quality & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grade:</span>
                    <Badge variant="outline">
                      {qualityGrades.find(g => g.value === cropData.grade)?.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Moisture:</span>
                    <span className="font-medium">{cropData.moisture}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature:</span>
                    <span className="font-medium">{cropData.temperature}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{cropData.location}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {cropData.photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uploaded Photos ({cropData.photos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cropData.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(photo)}
                        alt={`Crop photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.id 
                  ? 'bg-primary border-primary text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Register New Crop</CardTitle>
              <p className="text-muted-foreground mt-1">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {Math.round((currentStep / steps.length) * 100)}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Back to Dashboard' : 'Previous'}
        </Button>
        <Button onClick={handleNext}>
          {currentStep === 4 ? 'Submit Registration' : 'Next'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
