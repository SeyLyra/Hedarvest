import { Shield, TrendingUp, Eye, BarChart3 } from "lucide-react";

const InvestorAdvantageSection = () => {
  return (
    <section className="py-20">
      <div className="w-full px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Institutional-Grade{" "}
            <span className="bg-gradient-to-r from-trust-blue to-agricultural-green bg-clip-text text-transparent">
              Agricultural Investing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Access a new asset class with predictable returns backed by real-world agricultural operations
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 text-center">
            <Shield className="w-12 h-12 text-trust-blue mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-3">Real Asset Backing</h3>
            <p className="text-muted-foreground text-sm">100% collateralized by physical crops</p>
          </div>
          
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 text-center">
            <TrendingUp className="w-12 h-12 text-agricultural-green mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-3">Predictable Yields</h3>
            <p className="text-muted-foreground text-sm">1-10% APY from agricultural operations</p>
          </div>
          
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 text-center">
            <BarChart3 className="w-12 h-12 text-golden-accent mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-3">Low Correlation</h3>
            <p className="text-muted-foreground text-sm">Independent of crypto market fluctuations</p>
          </div>
          
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 text-center">
            <Eye className="w-12 h-12 text-trust-blue mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-3">Full Transparency</h3>
            <p className="text-muted-foreground text-sm">All operations verifiable on Hedera</p>
          </div>
        </div>
        
        {/* Live Data Dashboard */}
        <div className="bg-gradient-to-br from-trust-blue/5 to-agricultural-green/5 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">Live Performance Dashboard</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-trust-blue mb-2">8.2%</div>
              <div className="text-sm text-muted-foreground">Current APY</div>
              <div className="text-xs text-agricultural-green mt-1">↑ 0.3% this month</div>
            </div>
            
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-agricultural-green mb-2">$2.4M</div>
              <div className="text-sm text-muted-foreground">Total Value Locked</div>
              <div className="text-xs text-agricultural-green mt-1">↑ 15% this quarter</div>
            </div>
            
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-golden-accent mb-2">165%</div>
              <div className="text-sm text-muted-foreground">Collateral Ratio</div>
              <div className="text-xs text-muted-foreground mt-1">Above minimum 120%</div>
            </div>
            
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-trust-blue mb-2">0.2%</div>
              <div className="text-sm text-muted-foreground">Default Rate</div>
              <div className="text-xs text-muted-foreground mt-1">Historical average</div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">APY Historical Performance</h4>
            <div className="h-32 bg-gradient-to-r from-trust-blue/10 to-agricultural-green/10 rounded-lg flex items-end justify-center">
              <div className="text-muted-foreground text-sm">Chart: 6-month APY trend (8.1% → 8.2%)</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestorAdvantageSection;
