"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { backersDepositSchema, type BackersDepositFormData } from "@/lib/validations"
import { useBackersDeposit } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"

export default function BackersDepositForm() {
  const [txId, setTxId] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const backersDepositMutation = useBackersDeposit()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BackersDepositFormData>({
    resolver: zodResolver(backersDepositSchema),
  })

  const onSubmit = async (data: BackersDepositFormData) => {
    try {
      const result = await backersDepositMutation.mutateAsync(data)
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
          <CardTitle className="text-2xl text-green-600">Deposit Successful!</CardTitle>
          <CardDescription>
            Your investment has been added to the agricultural lending pool.
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
            Make Another Investment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Investment Pool Deposit</CardTitle>
        <CardDescription>
          Add funds to the agricultural lending pool and earn sustainable yields.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="depositAmount">Deposit Amount ($)</Label>
            <Input
              id="depositAmount"
              type="number"
              step="0.01"
              {...register("depositAmount", { valueAsNumber: true })}
              placeholder="1000.00"
            />
            {errors.depositAmount && (
              <p className="text-sm text-red-600">{errors.depositAmount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investmentDuration">Investment Duration</Label>
              <select
                id="investmentDuration"
                {...register("investmentDuration")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select duration</option>
                <option value="3months">3 Months</option>
                <option value="6months">6 Months</option>
                <option value="12months">12 Months</option>
                <option value="24months">24 Months</option>
              </select>
              {errors.investmentDuration && (
                <p className="text-sm text-red-600">{errors.investmentDuration.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskTolerance">Risk Tolerance</Label>
              <select
                id="riskTolerance"
                {...register("riskTolerance")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select risk level</option>
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
              {errors.riskTolerance && (
                <p className="text-sm text-red-600">{errors.riskTolerance.message}</p>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
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
                <Label htmlFor="taxId">Tax ID (SSN/EIN)</Label>
                <Input
                  id="taxId"
                  {...register("taxId")}
                  placeholder="123-45-6789"
                />
                {errors.taxId && (
                  <p className="text-sm text-red-600">{errors.taxId.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="agreeToTerms"
                {...register("agreeToTerms")}
                className="mt-1"
              />
              <Label htmlFor="agreeToTerms" className="text-sm">
                I agree to the{" "}
                <a href="#" className="text-primary underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary underline">
                  Investment Agreement
                </a>
              </Label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="accent"
            disabled={backersDepositMutation.isPending}
          >
            {backersDepositMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Investment...
              </>
            ) : (
              "Submit Investment"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
