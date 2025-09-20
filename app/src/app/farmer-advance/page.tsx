import FarmerAdvanceForm from "@/components/forms/FarmerAdvanceForm"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function FarmerAdvancePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-lg"></div>
                <span className="text-xl font-bold">Hedarvest</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="py-12">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Farmer Advance Request</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Request an advance against your upcoming harvest for immediate liquidity needs.
            </p>
          </div>
          
          <FarmerAdvanceForm />
        </div>
      </main>
    </div>
  )
}
