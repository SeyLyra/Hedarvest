import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-gradient-to-r from-agricultural-green to-golden-accent"></div>
            <span className="text-2xl font-bold text-foreground">Hedarvest</span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#for-farmers" className="text-muted-foreground hover:text-foreground transition-colors">
              For Farmers
            </a>
            <a href="#for-agents" className="text-muted-foreground hover:text-foreground transition-colors">
              For Agents
            </a>
          </nav>
          
          {/* CTA Button */}
          <div className="flex items-center space-x-4">
            <Button variant="farmer" size="sm">
              Find an Agent
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
