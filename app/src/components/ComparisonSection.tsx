import { Check, X } from "lucide-react";

const ComparisonSection = () => {
  const comparisons = [
    {
      feature: "Yield Source",
      traditional: "Bonds/Stocks",
      traditionalGood: false,
      defi: "Speculative",
      defiGood: false,
      hedarvest: "Real Assets",
      hedarvestGood: true
    },
    {
      feature: "Accessibility",
      traditional: "High barriers",
      traditionalGood: false,
      defi: "Tech-only",
      defiGood: false,
      hedarvest: "Inclusive",
      hedarvestGood: true
    },
    {
      feature: "Transparency",
      traditional: "Limited",
      traditionalGood: false,
      defi: "Partial",
      defiGood: true,
      hedarvest: "Full",
      hedarvestGood: true
    },
    {
      feature: "Volatility",
      traditional: "Market-dependent",
      traditionalGood: false,
      defi: "High",
      defiGood: false,
      hedarvest: "Low",
      hedarvestGood: true
    },
    {
      feature: "Asset Backing",
      traditional: "Paper claims",
      traditionalGood: false,
      defi: "Digital tokens",
      defiGood: false,
      hedarvest: "Physical crops",
      hedarvestGood: true
    },
    {
      feature: "Regulatory Risk",
      traditional: "Low",
      traditionalGood: true,
      defi: "High",
      defiGood: false,
      hedarvest: "Minimal",
      hedarvestGood: true
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Why Hedarvest Beats{" "}
            <span className="bg-gradient-to-r from-trust-blue to-agricultural-green bg-clip-text text-transparent">
              Traditional Options
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Compare our real-world asset approach with traditional finance and pure DeFi solutions
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
            {/* Header */}
            <div className="grid grid-cols-4 bg-muted/50 p-6">
              <div className="font-semibold text-foreground"></div>
              <div className="text-center font-semibold text-muted-foreground">Traditional Finance</div>
              <div className="text-center font-semibold text-muted-foreground">Pure DeFi</div>
              <div className="text-center font-semibold text-trust-blue">Hedarvest</div>
            </div>
            
            {/* Comparison Rows */}
            {comparisons.map((comparison, index) => (
              <div key={index} className={`grid grid-cols-4 p-6 ${index !== comparisons.length - 1 ? 'border-b border-border/50' : ''}`}>
                <div className="font-medium text-foreground">{comparison.feature}</div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {comparison.traditionalGood ? (
                      <Check className="w-4 h-4 text-agricultural-green" />
                    ) : (
                      <X className="w-4 h-4 text-destructive" />
                    )}
                    <span className="text-sm text-muted-foreground">{comparison.traditional}</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {comparison.defiGood ? (
                      <Check className="w-4 h-4 text-agricultural-green" />
                    ) : (
                      <X className="w-4 h-4 text-destructive" />
                    )}
                    <span className="text-sm text-muted-foreground">{comparison.defi}</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {comparison.hedarvestGood ? (
                      <Check className="w-4 h-4 text-agricultural-green" />
                    ) : (
                      <X className="w-4 h-4 text-destructive" />
                    )}
                    <span className="text-sm font-medium text-trust-blue">{comparison.hedarvest}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-trust-blue/10 to-agricultural-green/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                The Best of All Worlds
              </h3>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Hedarvest combines the security of traditional finance, the innovation of DeFi, 
                and the stability of real-world assets to create a superior investment experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
