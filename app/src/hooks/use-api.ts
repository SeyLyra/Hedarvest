import { useMutation, useQuery } from "@tanstack/react-query"
import { agentDepositSchema, farmerAdvanceSchema, backersDepositSchema } from "@/lib/validations"

// API Response Types
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  txId?: string
}

interface DepositResponse {
  txId: string
  status: "pending" | "confirmed" | "failed"
  amount: number
  timestamp: string
}

interface LoanResponse {
  txId: string
  status: "pending" | "approved" | "rejected"
  amount: number
  interestRate: number
  timestamp: string
}

interface PoolDepositResponse {
  txId: string
  status: "pending" | "confirmed" | "failed"
  amount: number
  poolId: string
  timestamp: string
}

// API Functions
const apiCall = async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
  const response = await fetch(`/api${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }

  return response.json()
}

// Agent Deposit Hook
export const useAgentDeposit = () => {
  return useMutation({
    mutationFn: (data: typeof agentDepositSchema._type) =>
      apiCall<DepositResponse>("/farmers/deposits", data),
    onSuccess: (response) => {
      console.log("Agent deposit successful:", response)
    },
    onError: (error) => {
      console.error("Agent deposit failed:", error)
    },
  })
}

// Farmer Advance Hook
export const useFarmerAdvance = () => {
  return useMutation({
    mutationFn: (data: typeof farmerAdvanceSchema._type) =>
      apiCall<LoanResponse>("/farmers/loans", data),
    onSuccess: (response) => {
      console.log("Farmer advance successful:", response)
    },
    onError: (error) => {
      console.error("Farmer advance failed:", error)
    },
  })
}

// Backers Deposit Hook
export const useBackersDeposit = () => {
  return useMutation({
    mutationFn: (data: typeof backersDepositSchema._type) =>
      apiCall<PoolDepositResponse>("/pools/deposit", data),
    onSuccess: (response) => {
      console.log("Backers deposit successful:", response)
    },
    onError: (error) => {
      console.error("Backers deposit failed:", error)
    },
  })
}

// Query hooks for fetching data
export const usePoolStats = () => {
  return useQuery({
    queryKey: ["pool-stats"],
    queryFn: () => fetch("/api/pools/stats").then(res => res.json()),
    staleTime: 30000, // 30 seconds
  })
}

export const useFarmerStats = () => {
  return useQuery({
    queryKey: ["farmer-stats"],
    queryFn: () => fetch("/api/farmers/stats").then(res => res.json()),
    staleTime: 30000, // 30 seconds
  })
}
