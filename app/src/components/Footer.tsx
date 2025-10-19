import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

const Footer = () => {
  const footerSections = [
    {
      title: "Platform",
      links: [
        { label: "How It Works", href: "#how-it-works" },
        { label: "For Farmers", href: "#for-farmers" },
        { label: "Pricing", href: "#" }
      ]
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Contact Us", href: "#" },
        { label: "Agent Training", href: "#" },
        { label: "Documentation", href: "#" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Press Kit", href: "#" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Cookie Policy", href: "#" },
        { label: "Compliance", href: "#" }
      ]
    }
  ];

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="w-full px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <Image 
                  src="/logo.png" 
                  alt="Hedarvest Logo" 
                  width={32} 
                  height={32} 
                  className="h-8 w-8"
                />
                <span className="text-2xl font-bold text-foreground">Hedarvest</span>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Transforming agricultural finance through blockchain technology. 
                Connecting farmers, agents, and buyers in a transparent, 
                efficient marketplace.
              </p>
              <div className="flex items-center gap-4">
                <Button variant="farmer" size="sm">
                  Get Started
                </Button>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </div>
            </div>
            
            {/* Links Sections */}
            <div className="lg:col-span-4 grid md:grid-cols-4 gap-8">
              {footerSections.map((section, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-foreground mb-4">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a 
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Bottom Section */}
        <div className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Hedarvest. All rights reserved.
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-agricultural-green"></div>
                Powered by Hedera Network
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-trust-blue"></div>
                Blockchain Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
