"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { agentDepositSchema, type AgentDepositFormData } from "@/lib/validations"
import { useAgentDeposit } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2, ArrowRight } from "lucide-react"

export default function AgentDepositForm() {
  const [txId, setTxId] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const agentDepositMutation = useAgentDeposit()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AgentDepositFormData>({
    resolver: zodResolver(agentDepositSchema),
  })

  const onSubmit = async (data: AgentDepositFormData) => {
    try {
      const result = await agentDepositMutation.mutateAsync(data)
      if (result.success && result.txId) {
        setTxId(result.txId)
        setIsSuccess(true)
        reset()
      }
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  if (isSuccess && txId) {
    return (
      <Card className="w-full max-w-2xl mx-auto glass card-hover">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl gradient-text">Deposit Successful!</CardTitle>
          <CardDescription className="text-lg">
            Your crop deposit has been processed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="glass p-6 rounded-xl border border-agricultural-green/20">
            <p className="text-sm text-muted-foreground mb-2">Transaction ID:</p>
            <p className="font-mono text-lg font-semibold bg-gradient-to-r from-agricultural-green to-trust-blue bg-clip-text text-transparent break-all">{txId}</p>
          </div>
          <Button 
            onClick={() => {
              setIsSuccess(false)
              setTxId(null)
            }}
            variant="outline"
            size="lg"
            className="group"
          >
            <span className="group-hover:animate-bounce">🔄</span>
            Make Another Deposit
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto glass card-hover">
      <CardHeader>
        <CardTitle className="text-2xl gradient-text">Agent Crop Deposit</CardTitle>
        <CardDescription className="text-lg">
          Submit crop deposit information for farmer verification and instant cash advance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <Label htmlFor="cropType" className="text-sm font-medium group-hover:text-agricultural-green transition-colors">Crop Type</Label>
              <Input
                id="cropType"
                {...register("cropType")}
                placeholder="e.g., Wheat, Corn, Soybeans"
                className="transition-all duration-300 focus:ring-2 focus:ring-agricultural-green/20 focus:border-agricultural-green"
              />
              {errors.cropType && (
                <p className="text-sm text-red-600 animate-fade-in">{errors.cropType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register("quantity", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <select
                id="unit"
                {...register("unit")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select unit</option>
                <option value="kg">Kilograms</option>
                <option value="tons">Tons</option>
                <option value="bushels">Bushels</option>
              </select>
              {errors.unit && (
                <p className="text-sm text-red-600">{errors.unit.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualityGrade">Quality Grade</Label>
              <Input
                id="qualityGrade"
                {...register("qualityGrade")}
                placeholder="e.g., Grade A, Premium"
              />
              {errors.qualityGrade && (
                <p className="text-sm text-red-600">{errors.qualityGrade.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
              <Input
                id="estimatedValue"
                type="number"
                step="0.01"
                {...register("estimatedValue", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.estimatedValue && (
                <p className="text-sm text-red-600">{errors.estimatedValue.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="storageLocation">Storage Location</Label>
              <Input
                id="storageLocation"
                {...register("storageLocation")}
                placeholder="e.g., Warehouse A, Silo 3"
              />
              {errors.storageLocation && (
                <p className="text-sm text-red-600">{errors.storageLocation.message}</p>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Farmer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farmerId">Farmer ID</Label>
                <Input
                  id="farmerId"
                  {...register("farmerId")}
                  placeholder="FARMER-001"
                />
                {errors.farmerId && (
                  <p className="text-sm text-red-600">{errors.farmerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmerName">Farmer Name</Label>
                <Input
                  id="farmerName"
                  {...register("farmerName")}
                  placeholder="John Doe"
                />
                {errors.farmerName && (
                  <p className="text-sm text-red-600">{errors.farmerName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmerContact">Contact</Label>
                <Input
                  id="farmerContact"
                  {...register("farmerContact")}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.farmerContact && (
                  <p className="text-sm text-red-600">{errors.farmerContact.message}</p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full group"
            variant="agent"
            size="lg"
            disabled={agentDepositMutation.isPending}
          >
            {agentDepositMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Deposit...
              </>
            ) : (
              <>
                <span className="group-hover:animate-bounce">📦</span>
                Submit Deposit
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
