"use client";

import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const serviceCategories = [
  {
    name: "Core Construction & Repair",
    description: "General contractors, remodeling, carpentry, and structural work",
    icon: "🏗️",
    services: ["General Contractor", "Remodeling Contractor", "Handyman Services", "Carpentry", "Drywall Installation & Repair", "Foundation Repair", "Structural Repair"],
  },
  {
    name: "Roofing",
    description: "Roof repair, replacement, inspections, and gutter installation",
    icon: "🏠",
    services: ["Roof Repair", "Roof Replacement", "Roof Inspection", "Gutter Installation", "Gutter Cleaning", "Skylight Installation"],
  },
  {
    name: "Electrical",
    description: "Wiring, panel upgrades, lighting, smart home, and EV chargers",
    icon: "⚡",
    services: ["Electrical Repair", "Panel Upgrades", "Lighting Installation", "Ceiling Fan Installation", "Smart Home Wiring", "EV Charger Installation", "Generator Installation", "Smart Lock Installation"],
  },
  {
    name: "Plumbing & Water",
    description: "Pipe repair, water heaters, drain cleaning, and fixture installation",
    icon: "🚰",
    services: ["Pipe Repair", "Water Heater Installation", "Drain Cleaning", "Faucet Installation", "Toilet Repair", "Sump Pump Installation", "Water Softener Installation", "Gas Line Installation", "Slab Leak Repair"],
  },
  {
    name: "HVAC & Mechanical",
    description: "Heating, cooling, ventilation, and indoor air quality",
    icon: "❄️",
    services: ["AC Installation", "AC Repair", "Furnace Installation", "Furnace Repair", "Heat Pump Installation", "Duct Cleaning", "Boiler Services", "Attic Fan Installation"],
  },
  {
    name: "Garage Doors & Access",
    description: "Installation, repair, openers, and spring replacement",
    icon: "🚪",
    services: ["Garage Door Installation", "Garage Door Repair", "Opener Installation", "Spring Replacement", "Door Installation", "Screen Installation & Repair"],
  },
  {
    name: "Landscaping & Outdoor",
    description: "Lawn care, garden design, tree services, and hardscaping",
    icon: "🌳",
    services: ["Lawn Care", "Landscape Design", "Tree Trimming", "Tree Removal", "Irrigation Systems", "Hardscaping", "Fence Installation", "Deck Building", "Pergola Installation", "Paver Installation"],
  },
  {
    name: "Painting & Finishes",
    description: "Interior and exterior painting, staining, and wallpaper",
    icon: "🎨",
    services: ["Interior Painting", "Exterior Painting", "Cabinet Painting", "Deck Staining", "Wallpaper Installation", "Pressure Washing", "Power Washing"],
  },
  {
    name: "Flooring",
    description: "Hardwood, tile, carpet, vinyl, laminate, and specialty",
    icon: "🪵",
    services: ["Hardwood Installation", "Tile Installation", "Carpet Installation", "Vinyl Flooring", "Laminate Flooring", "Epoxy Flooring", "Floor Refinishing", "Floor Repair"],
  },
  {
    name: "Windows & Doors",
    description: "Window and door installation, repair, and replacement",
    icon: "🪟",
    services: ["Window Installation", "Window Repair", "Door Installation", "Door Repair", "Storm Door Installation", "Glass & Glazing", "Sliding Door Repair"],
  },
  {
    name: "Kitchen & Bath",
    description: "Remodeling, countertops, cabinets, and fixture installation",
    icon: "🍳",
    services: ["Kitchen Remodeling", "Bathroom Remodeling", "Countertop Installation", "Cabinet Installation", "Backsplash Installation", "Shower Installation", "Custom Cabinetry"],
  },
  {
    name: "Concrete & Masonry",
    description: "Driveways, patios, foundations, and brick work",
    icon: "🧱",
    services: ["Driveway Installation", "Patio Installation", "Foundation Repair", "Brick Repair", "Concrete Repair", "Retaining Walls", "Masonry Work"],
  },
  {
    name: "Siding & Exterior",
    description: "Installation, repair, and replacement of home siding",
    icon: "🏡",
    services: ["Vinyl Siding", "Wood Siding", "Fiber Cement Siding", "Siding Repair", "Soffit & Fascia", "Stucco Contractor"],
  },
  {
    name: "Pest Control & Environment",
    description: "Extermination, prevention, wildlife removal, and mold",
    icon: "🐜",
    services: ["Pest Control", "Termite Treatment", "Rodent Control", "Bed Bug Treatment", "Mosquito Control", "Wildlife Removal", "Mold Remediation"],
  },
  {
    name: "Appliance Services",
    description: "Repair, installation, and maintenance of appliances",
    icon: "🔌",
    services: ["Refrigerator Repair", "Washer Repair", "Dryer Repair", "Dishwasher Repair", "Oven Repair", "Appliance Installation", "Microwave Repair"],
  },
  {
    name: "Cleaning & Restoration",
    description: "House cleaning, deep cleaning, carpet, and specialty services",
    icon: "🧹",
    services: ["House Cleaning", "Deep Cleaning", "Move-Out Cleaning", "Window Cleaning", "Carpet Cleaning", "Air Duct Cleaning", "Post-Construction Cleaning", "Water Restoration"],
  },
  {
    name: "Home Security & Smart Home",
    description: "Alarm systems, cameras, smart locks, and automation",
    icon: "🔐",
    services: ["Security System Installation", "Camera Installation", "Smart Lock Installation", "Motion Sensor Installation", "Smart Thermostat Installation", "Mesh WiFi Setup", "Home Theater Installation"],
  },
  {
    name: "Pool & Spa",
    description: "Pool maintenance, repair, and equipment installation",
    icon: "🏊",
    services: ["Pool Cleaning", "Pool Repair", "Pool Equipment Installation", "Pool Resurfacing", "Hot Tub Installation", "Hot Tub Repair", "Spa Services"],
  },
  {
    name: "Specialty Installations",
    description: "Closets, storage, fireplaces, and custom build-outs",
    icon: "🎯",
    services: ["Closet Systems Installation", "Garage Storage Systems", "Fireplace Installation", "Custom Built-Ins", "Murphy Bed Installation", "Sauna Installation", "Wine Cellar Construction"],
  },
  {
    name: "Insulation & Weatherization",
    description: "Attic, wall, basement insulation, and energy efficiency",
    icon: "🧤",
    services: ["Attic Insulation", "Wall Insulation", "Basement Insulation", "Spray Foam Insulation", "Energy Efficiency Upgrades", "Weatherization Services"],
  },
  {
    name: "Inspection & Consulting",
    description: "Home inspection, energy audit, and consultation services",
    icon: "🔍",
    services: ["Home Inspection", "Roof Inspection", "Plumbing Inspection", "Electrical Inspection", "Energy Audit", "Property Management"],
  },
  {
    name: "Moving & Junk Removal",
    description: "Moving, packing, storage, and junk removal services",
    icon: "🚚",
    services: ["Moving Company", "Packing Services", "Storage Services", "Junk Removal", "Trash Valet Services", "Hauling Services"],
  },
  {
    name: "Niche & Specialty Services",
    description: "Unique and specialty home services",
    icon: "⚙️",
    services: ["TV Mounting", "Mirror Installation", "Holiday Light Installation", "Locksmith", "Pet Door Installation", "Art Installation", "Golf Simulator Installation"],
  },
];

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Flatten all services into a single array with their categories
  const allServices = useMemo(() => {
    const services: { name: string; category: string }[] = [];
    serviceCategories.forEach((category) => {
      category.services.forEach((service) => {
        services.push({ name: service, category: category.name });
      });
      services.push({ name: category.name, category: category.name });
    });
    return services;
  }, []);

  // Fuzzy match function - matches characters in any order
  const fuzzyMatch = (str: string, query: string) => {
    const strLower = str.toLowerCase();
    const queryLower = query.toLowerCase();
    let queryIndex = 0;
    
    for (let i = 0; i < strLower.length && queryIndex < queryLower.length; i++) {
      if (strLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    
    return queryIndex === queryLower.length;
  };

  // Get autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const matches = allServices
      .filter((service) => fuzzyMatch(service.name, searchQuery))
      .slice(0, 8); // Limit to 8 suggestions
    
    return matches;
  }, [searchQuery, allServices]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return serviceCategories;
    
    const query = searchQuery.toLowerCase();
    return serviceCategories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query) ||
        category.services.some((service) => service.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Confetti Animation */}
      <AnimatePresence>
        {showCelebration && (
          <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
            {Array.from({ length: 60 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 0.8;
              const duration = 2.5 + Math.random() * 2;
              const size = 6 + Math.random() * 8;
              const rotation = Math.random() * 360;
              const colors = [
                "#22c55e", "#16a34a", "#facc15", "#f59e0b",
                "#3b82f6", "#ec4899", "#f97316", "#8b5cf6",
              ];
              const color = colors[i % colors.length];
              const shape = i % 3;

              return (
                <motion.div
                  key={`confetti-${i}`}
                  initial={{ y: -20, x: `${left}vw`, opacity: 1, rotate: rotation, scale: 1 }}
                  animate={{
                    y: "110vh",
                    rotate: rotation + 720,
                    opacity: [1, 1, 0.8, 0],
                    x: `${left + (Math.random() - 0.5) * 20}vw`,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration, delay, ease: "easeIn" }}
                  className="absolute"
                  style={{
                    width: shape === 2 ? size * 0.6 : size,
                    height: shape === 1 ? size * 0.6 : size,
                    backgroundColor: color,
                    borderRadius: shape === 0 ? "50%" : shape === 1 ? "2px" : "1px",
                  }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="px-4 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-balance text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              All Home Services, One Platform
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              From roofing to plumbing, electrical to landscaping - find qualified professionals for every home project. Post your job free and let contractors compete for your business.
            </p>

            {/* Search */}
            <div className="relative mx-auto mt-8 sm:mt-10 max-w-xl">
              <Search className="absolute left-3 sm:left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="h-12 sm:h-14 rounded-full bg-card pl-10 sm:pl-12 pr-4 text-sm sm:text-base shadow-sm"
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg z-50"
                >
                  <div className="p-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.name}-${index}`}
                        onClick={() => {
                          setSearchQuery(suggestion.name);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
                      >
                        <div className="font-medium text-sm text-foreground">
                          {suggestion.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {suggestion.category}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Service Categories Grid */}
      <section className="px-4 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          {filteredCategories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <p className="text-lg text-muted-foreground">
                No services found matching &quot;{searchQuery}&quot;
              </p>
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredCategories.map((category, index) => (
                <motion.div key={category.name} variants={fadeInUp}>
                  <Link 
                    href="/?newJob=true" 
                    className="block h-full"
                    onClick={() => {
                      setShowCelebration(true);
                      setTimeout(() => setShowCelebration(false), 3000);
                    }}
                  >
                    <Card className="group h-full cursor-pointer border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-lg">
                      <CardContent className="p-4 sm:p-6">
                        <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-secondary text-2xl sm:text-3xl">
                          {category.icon}
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2">
                          {category.name}
                        </h3>
                        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
                          {category.services.slice(0, 2).map((service) => (
                            <span
                              key={service}
                              className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                            >
                              {service}
                            </span>
                          ))}
                          {category.services.length > 2 && (
                            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              +{category.services.length - 2}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Post a job
                          <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* All Services List */}
      <section className="bg-card px-4 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Complete List of Services
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every service available on HomeBids
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {serviceCategories.map((category) => (
              <div key={category.name}>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <span>{category.icon}</span>
                  {category.name}
                </h3>
                <ul className="space-y-2">
                  {category.services.map((service) => (
                    <li key={service}>
                      <Link
                        href="/"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {service}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Mini */}
      <section className="px-4 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground">
              Get started in three simple steps
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-3"
          >
            {[
              {
                step: "1",
                title: "Describe Your Project",
                description:
                  "Tell us about your home service needs - what work you need done, your timeline, and budget.",
              },
              {
                step: "2",
                title: "Receive Competitive Bids",
                description:
                  "Qualified local contractors review your project and submit their best bids.",
              },
              {
                step: "3",
                title: "Choose Your Pro",
                description:
                  "Compare bids, read reviews, and select the contractor that's right for you.",
              },
            ].map((item) => (
              <Card key={item.step} className="border-border bg-card">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-primary px-8 py-16 text-center sm:px-16"
          >
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
              Ready to Start Your Project?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Post your job for free and start receiving bids from qualified contractors in your area.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/">
                  Post Your Job
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/how-it-works">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <ScrollToTop />
    </div>
  );
}
