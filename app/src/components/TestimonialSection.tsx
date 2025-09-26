import { Star } from "lucide-react";

const TestimonialSection = () => {
  const testimonials = [
    {
      quote: "Received cash same day - no more distress sales! This platform changed how I manage my harvest season cash flow.",
      author: "Maria Santos",
      role: "Corn Farmer, Iowa",
      type: "farmer",
      rating: 5
    },
    {
      quote: "Finally found yields uncorrelated to crypto markets. Real assets backing my investments gives me confidence.",
      author: "David Chen",
      role: "Portfolio Manager",
      type: "investor",
      rating: 5
    },
    {
      quote: "Added new revenue stream with minimal effort. The platform handles everything while I focus on storage operations.",
      author: "James Mitchell",
      role: "Grain Storage Agent",
      type: "agent",
      rating: 5
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'farmer': return 'agricultural-green';
      case 'investor': return 'trust-blue';
      case 'agent': return 'golden-accent';
      default: return 'muted-foreground';
    }
  };

  return (
    <section className="py-20">
      <div className="w-full px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-agricultural-green to-trust-blue bg-clip-text text-transparent">
              Agricultural Communities
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real stories from farmers, investors, and agents who are part of the Hedarvest ecosystem
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
              <div className="flex items-center gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 fill-current text-${getTypeColor(testimonial.type)}`} />
                ))}
              </div>
              
              <blockquote className="text-foreground leading-relaxed mb-6 text-lg">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-${getTypeColor(testimonial.type)} to-${getTypeColor(testimonial.type)}/70 flex items-center justify-center text-white font-bold text-lg`}>
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-agricultural-green"></div>
              <span>500+ Active Farmers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-trust-blue"></div>
              <span>200+ Institutional Investors</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-golden-accent"></div>
              <span>150+ Certified Agents</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
