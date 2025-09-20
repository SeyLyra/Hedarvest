"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { farmerAdvanceSchema, type FarmerAdvanceFormData } from "@/lib/validations"
import { useFarmerAdvance } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"

export default function FarmerAdvanceForm() {
  const [txId, setTxId] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const farmerAdvanceMutation = useFarmerAdvance()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FarmerAdvanceFormData>({
    resolver: zodResolver(farmerAdvanceSchema),
  })

  const onSubmit = async (data: FarmerAdvanceFormData) => {
    try {
      const result = await farmerAdvanceMutation.mutateAsync(data)
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Advance Request Submitted!</CardTitle>
          <CardDescription>
            Your advance request has been submitted for review.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Transaction ID:</p>
            <p className="font-mono text-lg font-semibold">{txId}</p>
          </div>
          <Button 
            onClick={() => {
              setIsSuccess(false)
              setTxId(null)
            }}
            variant="outline"
          >
            Request Another Advance
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Farmer Advance Request</CardTitle>
        <CardDescription>
          Request an advance against your upcoming harvest for immediate liquidity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="requestedAmount">Requested Amount ($)</Label>
            <Input
              id="requestedAmount"
              type="number"
              step="0.01"
              {...register("requestedAmount", { valueAsNumber: true })}
              placeholder="1000.00"
            />
            {errors.requestedAmount && (
              <p className="text-sm text-red-600">{errors.requestedAmount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cropType">Crop Type</Label>
              <Input
                id="cropType"
                {...register("cropType")}
                placeholder="e.g., Wheat, Corn, Soybeans"
              />
              {errors.cropType && (
                <p className="text-sm text-red-600">{errors.cropType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedHarvestDate">Expected Harvest Date</Label>
              <Input
                id="expectedHarvestDate"
                type="date"
                {...register("expectedHarvestDate")}
              />
              {errors.expectedHarvestDate && (
                <p className="text-sm text-red-600">{errors.expectedHarvestDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farmLocation">Farm Location</Label>
              <Input
                id="farmLocation"
                {...register("farmLocation")}
                placeholder="City, State, Country"
              />
              {errors.farmLocation && (
                <p className="text-sm text-red-600">{errors.farmLocation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmSize">Farm Size (acres)</Label>
              <Input
                id="farmSize"
                type="number"
                step="0.01"
                {...register("farmSize", { valueAsNumber: true })}
                placeholder="100.00"
              />
              {errors.farmSize && (
                <p className="text-sm text-red-600">{errors.farmSize.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="previousHarvests">Previous Harvests (years)</Label>
            <Input
              id="previousHarvests"
              type="number"
              {...register("previousHarvests", { valueAsNumber: true })}
              placeholder="5"
            />
            {errors.previousHarvests && (
              <p className="text-sm text-red-600">{errors.previousHarvests.message}</p>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Banking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  id="bankAccount"
                  {...register("bankAccount")}
                  placeholder="1234567890"
                />
                {errors.bankAccount && (
                  <p className="text-sm text-red-600">{errors.bankAccount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">Government ID Number</Label>
                <Input
                  id="idNumber"
                  {...register("idNumber")}
                  placeholder="SSN, SSN, etc."
                />
                {errors.idNumber && (
                  <p className="text-sm text-red-600">{errors.idNumber.message}</p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="farmer"
            disabled={farmerAdvanceMutation.isPending}
          >
            {farmerAdvanceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              "Submit Advance Request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
