import { z } from "zod"

// Agent Deposit Form Schema
export const agentDepositSchema = z.object({
  cropType: z.string().min(1, "Crop type is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.enum(["kg", "tons", "bushels"]),
  qualityGrade: z.string().min(1, "Quality grade is required"),
  estimatedValue: z.number().min(0.01, "Estimated value must be greater than 0"),
  storageLocation: z.string().min(1, "Storage location is required"),
  farmerId: z.string().min(1, "Farmer ID is required"),
  farmerName: z.string().min(1, "Farmer name is required"),
  farmerContact: z.string().min(1, "Farmer contact is required"),
})

export type AgentDepositFormData = z.infer<typeof agentDepositSchema>

// Farmer Advance Form Schema
export const farmerAdvanceSchema = z.object({
  requestedAmount: z.number().min(100, "Minimum advance is $100"),
  cropType: z.string().min(1, "Crop type is required"),
  expectedHarvestDate: z.string().min(1, "Expected harvest date is required"),
  farmLocation: z.string().min(1, "Farm location is required"),
  farmSize: z.number().min(0.01, "Farm size must be greater than 0"),
  previousHarvests: z.number().min(0, "Previous harvests cannot be negative"),
  bankAccount: z.string().min(1, "Bank account is required"),
  idNumber: z.string().min(1, "ID number is required"),
})

export type FarmerAdvanceFormData = z.infer<typeof farmerAdvanceSchema>

// Backers Deposit Form Schema
export const backersDepositSchema = z.object({
  depositAmount: z.number().min(100, "Minimum deposit is $100"),
  investmentDuration: z.enum(["3months", "6months", "12months", "24months"]),
  riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
  bankAccount: z.string().min(1, "Bank account is required"),
  taxId: z.string().min(1, "Tax ID is required"),
  agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
})

export type BackersDepositFormData = z.infer<typeof backersDepositSchema>
