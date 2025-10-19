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
  FlaskConical, 
  Camera, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Thermometer, 
  Droplets, 
  Scale, 
  Eye, 
  FileText, 
  QrCode, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Send, 
  RefreshCw, 
  Info, 
  AlertTriangle, 
  Clock, 
  User, 
  Calendar, 
  Package, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ExternalLink, 
  History, 
  Activity, 
  Shield, 
  Lock, 
  Key, 
  Bell, 
  Settings, 
  Home, 
  Warehouse, 
  Coins, 
  FileText as FileTextIcon, 
  Activity as ActivityIcon, 
  BarChart3 as BarChart3Icon, 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon, 
  Minus as MinusIcon, 
  Plus as PlusIcon, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Edit as EditIcon, 
  Trash2 as Trash2Icon, 
  ExternalLink as ExternalLinkIcon, 
  History as HistoryIcon, 
  Activity as ActivityIconIcon, 
  Shield as ShieldIcon, 
  Lock as LockIcon, 
  Key as KeyIcon, 
  Bell as BellIcon, 
  Settings as SettingsIcon, 
  Home as HomeIcon, 
  Warehouse as WarehouseIcon, 
  Coins as CoinsIcon
} from "lucide-react";

interface QualityInspectionProps {
  deliveryId: string;
  onBack: () => void;
  onComplete: (inspectionData: InspectionData) => void;
}

interface InspectionData {
  id: string;
  deliveryId: string;
  moisture: number;
  impurities: number;
  temperature: number;
  qualityGrade: string;
  inspectorName: string;
  inspectionDate: string;
  testResults: string[];
  photos: File[];
  notes: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  measurements: {
    weight: number;
    volume: number;
    density: number;
    color: string;
    texture: string;
  };
  contaminants: {
    pesticides: boolean;
    heavyMetals: boolean;
    mycotoxins: boolean;
    foreignMatter: boolean;
  };
  compliance: {
    organic: boolean;
    gmoFree: boolean;
    fairTrade: boolean;
    local: boolean;
  };
}

const qualityGrades = [
  { value: "premium", label: "Premium", description: "Highest quality, excellent condition", color: "green" },
  { value: "grade-a", label: "Grade A", description: "High quality, good condition", color: "blue" },
  { value: "grade-b", label: "Grade B", description: "Standard quality, acceptable condition", color: "yellow" },
  { value: "grade-c", label: "Grade C", description: "Lower quality, basic condition", color: "orange" },
  { value: "rejected", label: "Rejected", description: "Does not meet standards", color: "red" }
];

const testTypes = [
  "Moisture Content",
  "Protein Content", 
  "Purity Analysis",
  "Pesticide Residue",
  "Heavy Metal Analysis",
  "Mycotoxin Testing",
  "Germination Test",
  "Nutritional Analysis"
];

export default function QualityInspection({ deliveryId, onBack, onComplete }: QualityInspectionProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [inspectionData, setInspectionData] = useState<Partial<InspectionData>>({
    id: `insp_${Date.now()}`,
    deliveryId,
    moisture: 0,
    impurities: 0,
    temperature: 0,
    qualityGrade: "",
    inspectorName: "John Inspector",
    inspectionDate: new Date().toISOString().split('T')[0],
    testResults: [],
    photos: [],
    notes: "",
    status: "in-progress",
    measurements: {
      weight: 0,
      volume: 0,
      density: 0,
      color: "",
      texture: ""
    },
    contaminants: {
      pesticides: false,
      heavyMetals: false,
      mycotoxins: false,
      foreignMatter: false
    },
    compliance: {
      organic: false,
      gmoFree: false,
      fairTrade: false,
      local: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, title: "Basic Measurements", description: "Weight, moisture, temperature" },
    { id: 2, title: "Quality Assessment", description: "Grade, impurities, visual inspection" },
    { id: 3, title: "Contaminant Testing", description: "Safety and purity checks" },
    { id: 4, title: "Compliance & Documentation", description: "Certifications and photos" },
    { id: 5, title: "Review & Submit", description: "Final review and submission" }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!inspectionData.moisture || inspectionData.moisture <= 0) {
          newErrors.moisture = "Moisture content is required";
        }
        if (!inspectionData.temperature || inspectionData.temperature <= 0) {
          newErrors.temperature = "Temperature is required";
        }
        break;
      case 2:
        if (!inspectionData.qualityGrade) {
          newErrors.qualityGrade = "Quality grade is required";
        }
        if (!inspectionData.impurities || inspectionData.impurities < 0) {
          newErrors.impurities = "Impurities percentage is required";
        }
        break;
      case 3:
        // Contaminant testing validation
        break;
      case 4:
        if (inspectionData.photos?.length === 0) {
          newErrors.photos = "At least one photo is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
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

  const handleSubmit = () => {
    console.log("Submitting inspection:", inspectionData);
    onComplete(inspectionData as InspectionData);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setInspectionData(prev => ({
      ...prev,
      photos: [...(prev.photos || []), ...files]
    }));
  };

  const removePhoto = (index: number) => {
    setInspectionData(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index) || []
    }));
  };

  const addTestResult = (testType: string) => {
    setInspectionData(prev => ({
      ...prev,
      testResults: [...(prev.testResults || []), testType]
    }));
  };

  const removeTestResult = (index: number) => {
    setInspectionData(prev => ({
      ...prev,
      testResults: prev.testResults?.filter((_, i) => i !== index) || []
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Basic Measurements</h3>
            
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
                    value={inspectionData.moisture || ""}
                    onChange={(e) => setInspectionData(prev => ({ 
                      ...prev, 
                      moisture: parseFloat(e.target.value) || 0 
                    }))}
                    className="pl-10"
                  />
                </div>
                {errors.moisture && <p className="text-sm text-red-600">{errors.moisture}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C) *</Label>
                <div className="relative">
                  <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 25.0"
                    value={inspectionData.temperature || ""}
                    onChange={(e) => setInspectionData(prev => ({ 
                      ...prev, 
                      temperature: parseFloat(e.target.value) || 0 
                    }))}
                    className="pl-10"
                  />
                </div>
                {errors.temperature && <p className="text-sm text-red-600">{errors.temperature}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 500.0"
                    value={inspectionData.measurements?.weight || ""}
                    onChange={(e) => setInspectionData(prev => ({ 
                      ...prev, 
                      measurements: {
                        ...prev.measurements!,
                        weight: parseFloat(e.target.value) || 0
                      }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume">Volume (L)</Label>
                <Input
                  id="volume"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 250.0"
                  value={inspectionData.measurements?.volume || ""}
                  onChange={(e) => setInspectionData(prev => ({ 
                    ...prev, 
                    measurements: {
                      ...prev.measurements!,
                      volume: parseFloat(e.target.value) || 0
                    }
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="e.g., Golden yellow"
                  value={inspectionData.measurements?.color || ""}
                  onChange={(e) => setInspectionData(prev => ({ 
                    ...prev, 
                    measurements: {
                      ...prev.measurements!,
                      color: e.target.value
                    }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="texture">Texture</Label>
                <Select onValueChange={(value) => setInspectionData(prev => ({ 
                  ...prev, 
                  measurements: {
                    ...prev.measurements!,
                    texture: value
                  }
                }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select texture" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smooth">Smooth</SelectItem>
                    <SelectItem value="rough">Rough</SelectItem>
                    <SelectItem value="grainy">Grainy</SelectItem>
                    <SelectItem value="coarse">Coarse</SelectItem>
                    <SelectItem value="fine">Fine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Quality Assessment</h3>
            
            <div className="space-y-2">
              <Label htmlFor="qualityGrade">Quality Grade *</Label>
              <Select onValueChange={(value) => setInspectionData(prev => ({ ...prev, qualityGrade: value }))}>
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
              {errors.qualityGrade && <p className="text-sm text-red-600">{errors.qualityGrade}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="impurities">Impurities (%) *</Label>
              <Input
                id="impurities"
                type="number"
                step="0.1"
                placeholder="e.g., 2.5"
                value={inspectionData.impurities || ""}
                onChange={(e) => setInspectionData(prev => ({ 
                  ...prev, 
                  impurities: parseFloat(e.target.value) || 0 
                }))}
              />
              {errors.impurities && <p className="text-sm text-red-600">{errors.impurities}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Visual Inspection Notes</Label>
              <Textarea
                id="notes"
                placeholder="Describe the visual appearance, any defects, or observations..."
                value={inspectionData.notes || ""}
                onChange={(e) => setInspectionData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Contaminant Testing</h3>
            
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-foreground">Safety Checks</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(inspectionData.contaminants || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) => setInspectionData(prev => ({
                        ...prev,
                        contaminants: {
                          ...prev.contaminants!,
                          [key]: e.target.checked
                        }
                      }))}
                      className="h-4 w-4 text-green-600"
                    />
                    <label htmlFor={key} className="text-sm font-medium text-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-foreground">Test Results</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select onValueChange={addTestResult}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add test result" />
                    </SelectTrigger>
                    <SelectContent>
                      {testTypes.map((test) => (
                        <SelectItem key={test} value={test}>{test}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => {/* Handle add */}}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {inspectionData.testResults?.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm">{test}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTestResult(index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Compliance & Documentation</h3>
            
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-foreground">Certifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(inspectionData.compliance || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) => setInspectionData(prev => ({
                        ...prev,
                        compliance: {
                          ...prev.compliance!,
                          [key]: e.target.checked
                        }
                      }))}
                      className="h-4 w-4 text-green-600"
                    />
                    <label htmlFor={key} className="text-sm font-medium text-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-foreground">Inspection Photos</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">Upload inspection photos</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Take clear photos of the crop samples and inspection process
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
              {inspectionData.photos && inspectionData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {inspectionData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Inspection photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center py-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Review Inspection Results</h3>
              <p className="text-muted-foreground">
                Please review all inspection data before submitting
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Measurements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Moisture:</span>
                    <span className="font-medium">{inspectionData.moisture}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature:</span>
                    <span className="font-medium">{inspectionData.temperature}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{inspectionData.measurements?.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color:</span>
                    <span className="font-medium">{inspectionData.measurements?.color}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quality Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grade:</span>
                    <Badge className={getGradeColor(inspectionData.qualityGrade || "")}>
                      {qualityGrades.find(g => g.value === inspectionData.qualityGrade)?.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impurities:</span>
                    <span className="font-medium">{inspectionData.impurities}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tests:</span>
                    <span className="font-medium">{inspectionData.testResults?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {inspectionData.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Inspection Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground">{inspectionData.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getGradeColor = (grade: string) => {
    const gradeInfo = qualityGrades.find(g => g.value === grade);
    switch (gradeInfo?.color) {
      case "green": return "text-green-600 bg-green-100";
      case "blue": return "text-blue-600 bg-blue-100";
      case "yellow": return "text-yellow-600 bg-yellow-100";
      case "orange": return "text-orange-600 bg-orange-100";
      case "red": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
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
                  ? 'bg-green-600 border-green-600 text-white' 
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
                  currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
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
              <CardTitle className="text-2xl">Quality Inspection</CardTitle>
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
          {currentStep === 1 ? 'Back to Deliveries' : 'Previous'}
        </Button>
        <Button onClick={handleNext}>
          {currentStep === 5 ? 'Submit Inspection' : 'Next'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
