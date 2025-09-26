import { ArrowRight, Wheat, Lock, DollarSign, TrendingUp, BarChart3, RefreshCw } from "lucide-react";

const DualPathwaySection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="w-full px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Dual Pathways to{" "}
            <span className="bg-gradient-to-r from-agricultural-green to-trust-blue bg-clip-text text-transparent">
              Financial Innovation
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Whether you're farming the land or farming yields, our platform connects you to real-world asset opportunities
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
          {/* Farmer Pathway */}
          <div className="bg-card rounded-3xl p-8 shadow-card border border-border/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-agricultural-green/10 text-agricultural-green text-sm font-medium mb-4">
                Farmer Pathway
              </div>
              <h3 className="text-2xl font-bold text-foreground">Instant Liquidity</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-agricultural-green to-golden-accent rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Wheat className="w-5 h-5 text-agricultural-green" />
                    <span className="font-semibold text-foreground">Deposit Crops</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Bring harvest to certified agent for verification</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-agricultural-green to-golden-accent rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-5 h-5 text-agricultural-green" />
                    <span className="font-semibold text-foreground">Instant Cash</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Receive 60-70% LTV advance same day</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-agricultural-green to-golden-accent rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-agricultural-green" />
                    <span className="font-semibold text-foreground">Auto Repayment</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Repay automatically when you sell at market rates</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Investor Pathway */}
          <div className="bg-card rounded-3xl p-8 shadow-card border border-border/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-trust-blue/10 text-trust-blue text-sm font-medium mb-4">
                Investor Pathway
              </div>
              <h3 className="text-2xl font-bold text-foreground">Sustainable Yields</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-trust-blue to-agricultural-green rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-trust-blue" />
                    <span className="font-semibold text-foreground">Supply Liquidity</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Add funds to agricultural lending pool</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-trust-blue to-agricultural-green rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-trust-blue" />
                    <span className="font-semibold text-foreground">Earn Yield</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Generate returns from farmer advances</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-trust-blue to-agricultural-green rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-5 h-5 text-trust-blue" />
                    <span className="font-semibold text-foreground">Withdraw Anytime</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Maintain liquidity with flexible withdrawals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DualPathwaySection;
