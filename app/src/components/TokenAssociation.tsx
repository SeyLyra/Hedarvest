"use client"

import { useState } from "react"
import { useAssociateTokens } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2, AlertCircle, Link } from "lucide-react"

interface TokenAssociationProps {
  poolAddress: string
  userAddress: string
  onSuccess?: () => void
}

export default function TokenAssociation({ poolAddress, userAddress, onSuccess }: TokenAssociationProps) {
  const [isAssociated, setIsAssociated] = useState(false)
  const associateTokensMutation = useAssociateTokens()

  const handleAssociateTokens = async () => {
    try {
      const result = await associateTokensMutation.mutateAsync({
        poolAddress,
        userAddress,
      })
      
      if (result.success) {
        setIsAssociated(true)
        onSuccess?.()
      }
    } catch (error) {
      console.error("Token association failed:", error)
    }
  }

  if (isAssociated) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Tokens Associated Successfully!</p>
              <p className="text-sm text-green-600">
                You can now deposit collateral to this pool.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="h-5 w-5" />
          Token Association Required
        </CardTitle>
        <CardDescription className="text-amber-700">
          Before you can deposit to this pool, you need to associate with the required tokens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-amber-700">
            <p className="font-medium mb-2">This will associate you with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>USDC (Lending Token)</li>
              <li>WHEAT/RICE (Collateral Token)</li>
              <li>LP Token (Pool Share)</li>
              <li>Debt Token (Borrowing)</li>
            </ul>
          </div>
          
          <Button
            onClick={handleAssociateTokens}
            disabled={associateTokensMutation.isPending}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {associateTokensMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Associating Tokens...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Associate Tokens
              </>
            )}
          </Button>
          
          {associateTokensMutation.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              <p className="font-medium">Association Failed:</p>
              <p>{associateTokensMutation.error.message}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
