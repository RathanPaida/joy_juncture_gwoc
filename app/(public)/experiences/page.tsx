"use client";

import React, { useState, useRef, ChangeEvent, FormEvent, useEffect } from "react";

/* ================= TYPES ================= */
interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  date: string;
  eventType: string;
  guestCount: string;
  package: string;
  duration: string;
  notes: string;
}

interface CardGame {
  id: string;
  name: string;
  description: string;
  regularPrice: string;
  salePrice: string;
  category: string[];
  players: string;
  duration: string;
  features: string[];
  imageUrl: string;
}

interface GamePackage {
  id: string;
  name: string;
  price: string;
  duration: string;
  guestRange: string;
  category: string;
  includes?: {
    food?: string[];
    planning?: string[];
    sound?: string[];
    photography?: string[];
    games?: string[];
  };
  bestFor?: string;
  color?: string;
}

/* ================= COMPONENT ================= */
export default function CardGamesPage() {
  const [selectedCategory, setSelectedCategory] = useState("birthday-anniversary");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [currentDemo, setCurrentDemo] = useState(0);
  const [cardGames, setCardGames] = useState<CardGame[]>([]);
  const [gamePackages, setGamePackages] = useState<GamePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookingRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    phone: "",
    email: "",
    date: "",
    eventType: "birthday-anniversary",
    guestCount: "20-50 Guests",
    package: "",
    duration: "2-3 hours",
    notes: "",
  });

  /* ================= THEME COLORS - DARKER ORANGE THEME ================= */
  const colors = {
    // Darker orange palette
    primary: "#e67e22",     // Darker orange
    secondary: "#d35400",   // Even darker orange
    accent: "#f39c12",      // Orange accent
    success: "#27ae60",     // Green
    error: "#e74c3c",       // Red
    dark: "#0b0b0b",        // Black
    light: "#121212",       // Dark gray
    text: "#f5f5f5",        // White
    textLight: "#b3b3b3",   // Light gray
    border: "#2a2a2a",      // Dark border
    background: "#141414",  // Dark background
    inputBg: "#1a1a1a"      // Input background
  };

  /* ================= CATEGORIES - UPDATED WITH DARKER ORANGE ================= */
  const categories = [
    { id: "birthday-anniversary", name: "🎉 Birthdays & Anniversaries", color: "#e67e22" }, // Darker orange
    { id: "wedding", name: "💍 Weddings", color: "#f39c12" }, // Orange accent
    { id: "corporate-engagement", name: "💼 Corporate Engagement", color: "#3498db" }, // Blue
    { id: "carnival-games", name: "🎪 Carnival Games", color: "#9b59b6" } // Purple
  ];

  /* ================= GUEST COUNTS & DURATIONS ================= */
  const guestCounts = [
    "10-20 Guests",
    "20-50 Guests", 
    "50-100 Guests",
    "100-200 Guests",
    "200-300 Guests",
    "300+ Guests",
  ];

  const durations = [
    "2-3 hours",
    "3-4 hours",
    "4-5 hours",
    "5-6 hours",
    "6-8 hours",
    "Full Day",
  ];

  /* ================= DEMO PHOTOS ================= */
  const demoPhotos = [
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1492684223066-dd23140edf6d?w=1600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&h=400&fit=crop",
  ];

  /* ================= STATISTICS ================= */
  const stats = [
    { number: "500+", label: "Events Hosted" },
    { number: "10,000+", label: "Happy Guests" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "7+", label: "Card Games" }
  ];

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch games from public API
        try {
          const gamesRes = await fetch("/api/games/public");
          if (gamesRes.ok) {
            const gamesJson = await gamesRes.json();
            if (gamesJson.success && Array.isArray(gamesJson.data)) {
              setCardGames(gamesJson.data);
            } else {
              setCardGames(getFallbackGames());
            }
          } else {
            setCardGames(getFallbackGames());
          }
        } catch (gamesError: any) {
          console.error("Error fetching games:", gamesError);
          setCardGames(getFallbackGames());
          setError("Using demo games data. Could not connect to games API.");
        }

        // Fetch packages from public API
        try {
          const packagesRes = await fetch("/api/packages/public");
          if (packagesRes.ok) {
            const packagesJson = await packagesRes.json();
            if (packagesJson.success && Array.isArray(packagesJson.data)) {
              setGamePackages(packagesJson.data);
            } else {
              setGamePackages(getFallbackPackages());
            }
          } else {
            setGamePackages(getFallbackPackages());
          }
        } catch (packagesError: any) {
          console.error("Error fetching packages:", packagesError);
          setGamePackages(getFallbackPackages());
        }

      } catch (e: any) {
        console.error("General fetch error:", e);
        setError("Failed to load data. Please refresh the page.");
        setCardGames(getFallbackGames());
        setGamePackages(getFallbackPackages());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ================= CAROUSEL EFFECT ================= */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDemo(p => (p + 1) % demoPhotos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  /* ================= FALLBACK DATA ================= */
  const getFallbackGames = (): CardGame[] => {
    return [
      {
        id: "1",
        name: "Dead Man's Deck",
        description: "A thrilling mystery card game where players solve a murder mystery through strategic card play.",
        regularPrice: "₹999",
        salePrice: "₹799",
        category: ["corporate-engagement", "carnival-games"],
        players: "4-8 Players",
        duration: "60-90 mins",
        features: ["Mystery solving", "Team strategy", "Suspense elements", "Replay value"],
        imageUrl: "https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=400&h=225&fit=crop"
      },
      {
        id: "2",
        name: "Mehfil – The Ultimate Musical Card Game",
        description: "Musical card game that combines music knowledge with fun challenges. Great for celebrations and parties.",
        regularPrice: "₹799",
        salePrice: "₹499",
        category: ["birthday-anniversary", "wedding", "carnival-games"],
        players: "2-10 Players",
        duration: "45-75 mins",
        features: ["Music based", "Cultural elements", "Singing challenges", "Fun for all ages"],
        imageUrl: "https://images.unsplash.com/photo-1508739826987-b79cd8b7da12?w=400&h=225&fit=crop"
      },
      {
        id: "3",
        name: "Tamasha – The Bollywood Bid Card Game",
        description: "Bollywood themed bidding game with movie trivia and auctions. Perfect for Indian weddings and celebrations.",
        regularPrice: "₹799",
        salePrice: "₹499",
        category: ["birthday-anniversary", "wedding", "carnival-games"],
        players: "3-8 Players",
        duration: "60-120 mins",
        features: ["Bollywood theme", "Bidding strategy", "Movie trivia", "Interactive gameplay"],
        imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=225&fit=crop"
      },
      {
        id: "4",
        name: "The Bloody Inheritance | Murder Mystery Case File",
        description: "Complete murder mystery game with case files and investigation. Professional setup for immersive experiences.",
        regularPrice: "₹1,999",
        salePrice: "₹999",
        category: ["corporate-engagement", "carnival-games"],
        players: "6-15 Players",
        duration: "120-180 mins",
        features: ["Full investigation kit", "Character roles", "Evidence analysis", "Professional setup"],
        imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=225&fit=crop"
      },
      {
        id: "5",
        name: "Buzzed – The Drinking Card Game",
        description: "Fun party drinking game for adult gatherings and birthday celebrations.",
        regularPrice: "₹599",
        salePrice: "₹359",
        category: ["birthday-anniversary", "carnival-games"],
        players: "4-12 Players",
        duration: "30-90 mins",
        features: ["Party game", "Fun challenges", "Social drinking", "Ice breaker"],
        imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=225&fit=crop"
      },
      {
        id: "6",
        name: "Judge Me & Guess",
        description: "Judgment and guessing game that reveals interesting facts about players.",
        regularPrice: "₹1,499",
        salePrice: "₹999",
        category: ["corporate-engagement", "birthday-anniversary", "wedding"],
        players: "4-20 Players",
        duration: "45-90 mins",
        features: ["Judgment game", "Revealing facts", "Social bonding", "Team building"],
        imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=225&fit=crop"
      },
      {
        id: "7",
        name: "One More Round | Jigsaw Puzzle",
        description: "Jigsaw puzzle game with drinking challenges for fun gatherings.",
        regularPrice: "₹599",
        salePrice: "₹399",
        category: ["birthday-anniversary", "carnival-games"],
        players: "2-6 Players",
        duration: "60-120 mins",
        features: ["Puzzle solving", "Drinking challenges", "Team coordination", "Fun completion"],
        imageUrl: "https://images.unsplash.com/photo-1492684223066-dd23140edf6d?w=400&h=225&fit=crop"
      }
    ];
  };

  const getFallbackPackages = (): GamePackage[] => {
    return [
      {
        id: "1",
        name: "Birthday & Anniversary Package",
        price: "₹34,999",
        duration: "3-4 Hours",
        guestRange: "20-50 Guests",
        color: "#e67e22", // Darker orange
        bestFor: "Birthdays & Anniversaries (16+ years)",
        category: "birthday-anniversary",
        includes: {
          food: ["Birthday/Anniversary cake", "Snacks & finger foods", "Soft drinks & mocktails", "Customized celebration menu"],
          planning: ["Theme decoration", "Game station setup", "Prize distribution", "Celebration timeline management"],
          sound: ["DJ with celebration music", "Wireless microphones", "Sound effects", "Announcement system"],
          photography: ["Candid shots", "Group photos", "Cake cutting photos", "Digital album delivery"],
          games: ["Mehfil Musical Game", "Buzzed Drinking Game", "Tamasha Bollywood Game", "Judge Me & Guess"]
        }
      },
      {
        id: "2",
        name: "Wedding Celebration Package",
        price: "₹74,999",
        duration: "4-6 Hours",
        guestRange: "100-300 Guests",
        color: "#f39c12", // Orange accent
        bestFor: "Wedding receptions & Sangeet nights",
        category: "wedding",
        includes: {
          food: ["Grand buffet setup", "Live food counters", "Wedding cake station", "Traditional sweets & desserts"],
          planning: ["Complete wedding game setup", "Multiple entertainment zones", "Bride-groom game coordination", "Family participation management"],
          sound: ["Live band/DJ services", "Dance floor setup", "Multi-zone audio system", "Professional sound engineer"],
          photography: ["Full event coverage", "Candid wedding moments", "Family portraits", "Professional videography"],
          games: ["Tamasha Bollywood Game", "Mehfil Musical Game", "Judge Me & Guess", "Custom wedding couple games"]
        }
      },
      {
        id: "3",
        name: "Corporate Engagement Package",
        price: "₹49,999",
        duration: "4-5 Hours",
        guestRange: "50-150 Employees",
        color: "#3498db", // Blue
        bestFor: "Corporate events & Team building",
        category: "corporate-engagement",
        includes: {
          food: ["Networking snacks", "Coffee/tea station", "Healthy meal options", "Refreshment counters"],
          planning: ["Team formation activities", "Professional facilitator", "Score tracking system", "Brand integration options"],
          sound: ["Background corporate music", "Presentation audio setup", "Team announcements", "Professional AV system"],
          photography: ["Team activity photos", "Corporate event coverage", "Leadership moments", "Event highlight reel"],
          games: ["Dead Man's Deck", "The Bloody Inheritance", "Judge Me & Guess", "Team strategy games"]
        }
      },
      {
        id: "4",
        name: "Carnival Games Package",
        price: "₹54,999",
        duration: "4-6 Hours",
        guestRange: "50-200 Guests",
        color: "#9b59b6", // Purple
        bestFor: "Festivals, Fairs & Large gatherings",
        category: "carnival-games",
        includes: {
          food: ["Multiple food stalls", "Snack counters", "Beverage stations", "Carnival treats"],
          planning: ["Multiple game zones setup", "Prize redemption counter", "Queue management", "Safety & crowd control"],
          sound: ["Carnival atmosphere music", "Game announcement system", "Zone-specific audio", "Entertainment DJ"],
          photography: ["Carnival action shots", "Prize winner photos", "Crowd moments", "Event documentation"],
          games: ["All featured card games", "Carnival classic games", "Prize challenge games", "Interactive group games"]
        }
      }
    ];
  };

  /* ================= FILTER FUNCTIONS ================= */
  const filteredGames = cardGames.filter(g => {
    if (!g.category || !Array.isArray(g.category)) return false;
    return g.category.includes(selectedCategory);
  });

  const filteredPackages = gamePackages.filter(p => p.category === selectedCategory);

  /* ================= HANDLERS ================= */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const toggleGame = (gameId: string) => {
    setSelectedGames(prev =>
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId) 
        : [...prev, gameId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);

    // Get selected game names
    const selectedGameNames = selectedGames.map(gameId => {
      const game = cardGames.find(g => g.id === gameId);
      return game ? game.name : gameId;
    });

    const bookingData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      package: formData.package,
      date: formData.date,
      eventType: selectedCategory,
      guestCount: formData.guestCount,
      duration: formData.duration,
      selectedGames: selectedGameNames,
      notes: formData.notes,
      totalPrice: calculateTotalPrice(),
      bookingDate: new Date().toISOString(),
    };

    console.log("📤 Submitting booking to public API:", bookingData);

    try {
      const res = await fetch("/api/bookings/public", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      console.log("📥 Booking response:", data);

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (data.success) {
        setShowSuccess(true);
        // Reset form
        setFormData({
          name: "",
          phone: "",
          email: "",
          date: "",
          eventType: selectedCategory,
          guestCount: "20-50 Guests",
          package: "",
          duration: "2-3 hours",
          notes: "",
        });
        setSelectedGames([]);
        
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        setError(`Booking failed: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("❌ Submit error:", error);
      setError(error.message || "Failed to submit booking. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const scrollToForm = (packageName = "", category = "") => {
    if (packageName) {
      setSelectedPackage(packageName);
      setFormData(prev => ({ 
        ...prev, 
        package: packageName,
        eventType: category || prev.eventType 
      }));
    }
    if (category) {
      setSelectedCategory(category);
      setFormData(prev => ({ ...prev, eventType: category }));
    }
    setTimeout(() => {
      bookingRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const calculateTotalPrice = () => {
    const selectedPackage = gamePackages.find(p => p.name === formData.package);
    if (!selectedPackage) return "₹0";
    return selectedPackage.price;
  };

  /* ================= LOADER ================= */
  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.light} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.text,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            fontSize: "48px", 
            marginBottom: "20px",
            animation: "spin 1s linear infinite"
          }}>🎴</div>
          <h2>Loading Games & Packages...</h2>
          <p style={{ color: colors.textLight }}>Please wait while we fetch the latest offerings</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  /* ================= SUCCESS MESSAGE ================= */
  if (showSuccess) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.light} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.text,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        padding: "2rem"
      }}>
        <div style={{
          background: colors.background,
          padding: "3rem",
          borderRadius: "12px",
          border: `2px solid ${colors.success}`,
          textAlign: "center",
          maxWidth: "500px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)"
        }}>
          <div style={{ 
            fontSize: "64px", 
            marginBottom: "20px",
            color: colors.success 
          }}>🎉</div>
          <h2 style={{ 
            color: colors.success, 
            marginBottom: "1rem",
            fontSize: "2rem",
            fontWeight: 700
          }}>Booking Successful!</h2>
          <p style={{ 
            marginBottom: "2rem", 
            color: colors.textLight,
            lineHeight: 1.6
          }}>
            Thank you for your booking! We'll contact you within 24 hours to confirm details.
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            style={{
              padding: "14px 28px",
              borderRadius: "8px",
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              color: colors.dark,
              border: "none",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
              width: "100%"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = `0 10px 25px rgba(230, 126, 34, 0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Book Another Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.light} 100%)`,
      color: colors.text,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
    }}>
      {/* HERO SECTION */}
      <section style={{
        padding: "80px 20px",
        textAlign: "center",
        background: `linear-gradient(135deg, ${colors.dark} 0%, #1a1a1a 100%)`,
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${demoPhotos[currentDemo]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.2,
          zIndex: 1
        }} />
        
        <div style={{ position: "relative", zIndex: 2 }}>
          <h1 style={{
            fontSize: "3rem",
            fontWeight: 800,
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "1rem",
            fontFamily: "'Poppins', sans-serif"
          }}>
            Joy Juncture Premium Card Games
          </h1>
          <p style={{
            fontSize: "1.1rem",
            color: colors.textLight,
            maxWidth: "600px",
            margin: "0 auto 2rem",
            lineHeight: 1.6
          }}>
            Professional card game setups for all celebrations with complete event planning
          </p>
          
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            flexWrap: "wrap",
            marginTop: "2rem"
          }}>
            {stats.map((stat, index) => (
              <div key={index} style={{
                textAlign: "center",
                padding: "1rem",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                minWidth: "120px"
              }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: colors.accent, marginBottom: "0.5rem" }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: "0.8rem", color: colors.textLight }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO CAROUSEL */}
      <section style={{ padding: "60px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{
          textAlign: "center",
          fontSize: "2rem",
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 700,
          marginBottom: "2rem",
          color: colors.text
        }}>
          <span style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Game</span> Event Moments
        </h2>
        
        <div style={{
          maxWidth: "800px",
          margin: "0 auto 2rem",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5)`,
          border: `1px solid ${colors.border}`,
          height: "400px"
        }}>
          <img 
            src={demoPhotos[currentDemo]} 
            alt={`Game Event ${currentDemo + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        </div>
      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={{
          maxWidth: "1200px",
          margin: "1rem auto 2rem",
          padding: "0 20px"
        }}>
          <div style={{
            background: "rgba(231, 76, 60, 0.1)",
            border: `1px solid ${colors.error}`,
            color: colors.error,
            padding: "12px",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{
                background: "transparent",
                border: "none",
                color: colors.error,
                cursor: "pointer",
                fontSize: "20px"
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* CATEGORY SELECTION */}
      <section style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{
          textAlign: "center",
          fontSize: "2rem",
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 700,
          marginBottom: "2rem",
          color: colors.text
        }}>
          Select Your <span style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Event Type</span>
        </h2>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "3rem"
        }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setFormData(prev => ({ ...prev, eventType: category.id }));
              }}
              style={{
                padding: "15px 30px",
                background: selectedCategory === category.id 
                  ? category.color 
                  : colors.background,
                color: selectedCategory === category.id ? colors.dark : colors.text,
                border: `2px solid ${category.color}`,
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                minWidth: "220px"
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.background = `${category.color}40`;
                }
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.background = colors.background;
                }
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* CARD GAMES FOR SELECTED CATEGORY */}
        <div style={{ marginBottom: "3rem" }}>
          <h3 style={{
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            color: colors.text
          }}>
            Featured Card Games for {categories.find(c => c.id === selectedCategory)?.name}
          </h3>
          
          {filteredGames.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "4rem",
              color: colors.textLight
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎴</div>
              <h3>No games found for this category</h3>
              <p>Try selecting a different category above or check back later for new games</p>
            </div>
          ) : (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2rem"
              }}>
                {filteredGames.map((game) => (
                  <div key={game.id} style={{
                    background: colors.background,
                    border: `1px solid ${selectedGames.includes(game.id) ? colors.primary : colors.border}`,
                    borderRadius: "12px",
                    padding: "1.5rem",
                    transition: "all 0.3s ease",
                    position: "relative",
                    cursor: "pointer"
                  }}
                  onClick={() => toggleGame(game.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = `0 10px 25px rgba(230, 126, 34, 0.2)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  >
                    {selectedGames.includes(game.id) && (
                      <div style={{
                        position: "absolute",
                        top: "-10px",
                        right: "-10px",
                        background: colors.primary,
                        color: colors.dark,
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "1.2rem"
                      }}>
                        ✓
                      </div>
                    )}
                    
                    <div style={{ 
                      width: "100%", 
                      height: "200px", 
                      borderRadius: "8px",
                      background: game.imageUrl ? `url(${game.imageUrl})` : colors.inputBg,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      marginBottom: "1rem"
                    }} />
                    
                    <h4 style={{ 
                      color: colors.text, 
                      fontSize: "1.2rem", 
                      fontWeight: 700,
                      marginBottom: "0.5rem"
                    }}>
                      {game.name}
                    </h4>
                    
                    <p style={{ 
                      color: colors.textLight, 
                      fontSize: "0.9rem",
                      marginBottom: "1rem",
                      lineHeight: 1.5,
                      minHeight: "68px"
                    }}>
                      {game.description.length > 100 
                        ? `${game.description.substring(0, 100)}...` 
                        : game.description}
                    </p>
                    
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem"
                    }}>
                      <div>
                        <div style={{ 
                          fontSize: "0.8rem", 
                          color: colors.textLight,
                          textDecoration: "line-through"
                        }}>
                          {game.regularPrice}
                        </div>
                        <div style={{ 
                          fontSize: "1.2rem", 
                          color: colors.primary,
                          fontWeight: 700
                        }}>
                          {game.salePrice}
                        </div>
                      </div>
                      
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.8rem", color: colors.textLight }}>
                          {game.players}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: colors.textLight }}>
                          {game.duration}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem"
                    }}>
                      {game.features.slice(0, 2).map((feature, index) => (
                        feature && (
                          <div key={index} style={{
                            padding: "3px 8px",
                            background: "rgba(230, 126, 34, 0.1)",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            color: colors.primary
                          }}>
                            {feature}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedGames.length > 0 && (
                <div style={{
                  background: `linear-gradient(135deg, rgba(230, 126, 34, 0.2), rgba(211, 84, 0, 0.2))`,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: "10px",
                  padding: "1.5rem",
                  marginTop: "2rem",
                  textAlign: "center"
                }}>
                  <h4 style={{ color: colors.text, marginBottom: "0.5rem" }}>
                    Selected Games ({selectedGames.length})
                  </h4>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    justifyContent: "center"
                  }}>
                    {selectedGames.map((gameId) => {
                      const game = cardGames.find(g => g.id === gameId);
                      const gameName = game ? game.name : gameId;
                      return (
                        <div key={gameId} style={{
                          padding: "6px 12px",
                          background: colors.primary,
                          color: colors.dark,
                          borderRadius: "15px",
                          fontSize: "0.85rem",
                          fontWeight: 600
                        }}>
                          {gameName}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* EVENT PACKAGES SECTION */}
      <section style={{ 
        padding: "60px 20px", 
        backgroundColor: "rgba(26, 26, 26, 0.7)",
        borderTop: `1px solid ${colors.border}`,
        borderBottom: `1px solid ${colors.border}`
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <h2 style={{
            textAlign: "center",
            fontSize: "2.5rem",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            marginBottom: "3rem",
            color: colors.text
          }}>
            Complete Event <span style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>Packages</span>
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "2rem"
          }}>
            {filteredPackages.map((pkg) => {
              const pkgColor = pkg.color || colors.primary;
              return (
                <div key={pkg.id} style={{
                  background: colors.background,
                  border: `2px solid ${pkgColor}`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.boxShadow = `0 20px 40px ${pkgColor}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
                >
                  <div style={{
                    background: `linear-gradient(135deg, ${pkgColor}, ${pkgColor}80)`,
                    padding: "1.5rem",
                    textAlign: "center"
                  }}>
                    <h3 style={{ 
                      color: colors.dark, 
                      fontSize: "1.5rem", 
                      fontWeight: 800,
                      marginBottom: "0.5rem"
                    }}>
                      {pkg.name}
                    </h3>
                    <div style={{ 
                      fontSize: "2rem", 
                      color: colors.dark,
                      fontWeight: 900,
                      marginBottom: "0.5rem"
                    }}>
                      {pkg.price}
                    </div>
                    <div style={{ 
                      fontSize: "0.9rem", 
                      color: colors.dark,
                      fontWeight: 600
                    }}>
                      {pkg.duration} • {pkg.guestRange}
                    </div>
                  </div>
                  
                  <div style={{ padding: "1.5rem" }}>
                    {pkg.bestFor && (
                      <div style={{
                        backgroundColor: `${pkgColor}20`,
                        padding: "0.75rem",
                        borderRadius: "8px",
                        marginBottom: "1.5rem",
                        textAlign: "center"
                      }}>
                        <div style={{ 
                          color: pkgColor, 
                          fontSize: "0.9rem",
                          fontWeight: 600
                        }}>
                          {pkg.bestFor}
                        </div>
                      </div>
                    )}
                    
                    {pkg.includes && Object.keys(pkg.includes).length > 0 && (
                      <>
                        {pkg.includes.food && pkg.includes.food.length > 0 && (
                          <div style={{ marginBottom: "1.5rem" }}>
                            <h4 style={{ 
                              color: colors.text, 
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              marginBottom: "0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem"
                            }}>
                              <span style={{ color: pkgColor }}>🍽️</span> Food & Beverages
                            </h4>
                            <ul style={{ 
                              padding: "0 0 0 1rem", 
                              margin: 0,
                              listStyleType: "none"
                            }}>
                              {pkg.includes.food.map((item, index) => (
                                <li key={index} style={{ 
                                  color: colors.textLight, 
                                  fontSize: "0.9rem",
                                  marginBottom: "0.25rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem"
                                }}>
                                  <span style={{ color: pkgColor, fontSize: "0.8rem" }}>•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {pkg.includes.planning && pkg.includes.planning.length > 0 && (
                          <div style={{ marginBottom: "1.5rem" }}>
                            <h4 style={{ 
                              color: colors.text, 
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              marginBottom: "0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem"
                            }}>
                              <span style={{ color: pkgColor }}>📋</span> Event Planning
                            </h4>
                            <ul style={{ 
                              padding: "0 0 0 1rem", 
                              margin: 0,
                              listStyleType: "none"
                            }}>
                              {pkg.includes.planning.map((item, index) => (
                                <li key={index} style={{ 
                                  color: colors.textLight, 
                                  fontSize: "0.9rem",
                                  marginBottom: "0.25rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem"
                                }}>
                                  <span style={{ color: pkgColor, fontSize: "0.8rem" }}>•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {pkg.includes.sound && pkg.includes.sound.length > 0 && (
                          <div style={{ marginBottom: "1.5rem" }}>
                            <h4 style={{ 
                              color: colors.text, 
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              marginBottom: "0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem"
                            }}>
                              <span style={{ color: pkgColor }}>🔊</span> Sound & Music
                            </h4>
                            <ul style={{ 
                              padding: "0 0 0 1rem", 
                              margin: 0,
                              listStyleType: "none"
                            }}>
                              {pkg.includes.sound.map((item, index) => (
                                <li key={index} style={{ 
                                  color: colors.textLight, 
                                  fontSize: "0.9rem",
                                  marginBottom: "0.25rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem"
                                }}>
                                  <span style={{ color: pkgColor, fontSize: "0.8rem" }}>•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {pkg.includes.photography && pkg.includes.photography.length > 0 && (
                          <div style={{ marginBottom: "1.5rem" }}>
                            <h4 style={{ 
                              color: colors.text, 
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              marginBottom: "0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem"
                            }}>
                              <span style={{ color: pkgColor }}>📷</span> Photography
                            </h4>
                            <ul style={{ 
                              padding: "0 0 0 1rem", 
                              margin: 0,
                              listStyleType: "none"
                            }}>
                              {pkg.includes.photography.map((item, index) => (
                                <li key={index} style={{ 
                                  color: colors.textLight, 
                                  fontSize: "0.9rem",
                                  marginBottom: "0.25rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem"
                                }}>
                                  <span style={{ color: pkgColor, fontSize: "0.8rem" }}>•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {pkg.includes.games && pkg.includes.games.length > 0 && (
                          <div style={{ marginBottom: "1.5rem" }}>
                            <h4 style={{ 
                              color: colors.text, 
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              marginBottom: "0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem"
                            }}>
                              <span style={{ color: pkgColor }}>🎮</span> Included Games
                            </h4>
                            <ul style={{ 
                              padding: "0 0 0 1rem", 
                              margin: 0,
                              listStyleType: "none"
                            }}>
                              {pkg.includes.games.map((item, index) => (
                                <li key={index} style={{ 
                                  color: colors.textLight, 
                                  fontSize: "0.9rem",
                                  marginBottom: "0.25rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem"
                                }}>
                                  <span style={{ color: pkgColor, fontSize: "0.8rem" }}>•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => scrollToForm(pkg.name, pkg.category)}
                      style={{
                        background: `linear-gradient(135deg, ${pkgColor} 0%, ${pkgColor}80 100%)`,
                        color: colors.dark,
                        border: "none",
                        borderRadius: "8px",
                        padding: "14px",
                        fontSize: "1rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        width: "100%",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = `0 10px 20px ${pkgColor}80`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      Select This Package →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOOKING FORM */}
      <section style={{ 
        padding: "60px 20px", 
        background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.light} 100%)` 
      }} ref={bookingRef}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ 
            textAlign: "center", 
            fontSize: "2rem",
            fontFamily: "'Poppins', sans-serif", 
            fontWeight: 700, 
            marginBottom: "1rem", 
            color: colors.text 
          }}>
            Book Your <span style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>Card Games</span> Event
          </h2>

          <p style={{ 
            textAlign: "center", 
            color: colors.textLight, 
            fontSize: "1.1rem",
            marginBottom: "3rem"
          }}>
            Fill out the form below to book your premium card games event. We'll contact you within 24 hours to confirm details.
          </p>

          <form onSubmit={handleSubmit} style={{
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              marginBottom: "1.5rem"
            }}>
              <div>
                <label style={{
                  display: "block",
                  color: colors.text,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem"
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.border = `1px solid ${colors.primary}`}
                  onBlur={(e) => e.target.style.border = `1px solid ${colors.border}`}
                />
              </div>

              <div>
                <label style={{
                  display: "block",
                  color: colors.text,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem"
                }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.border = `1px solid ${colors.primary}`}
                  onBlur={(e) => e.target.style.border = `1px solid ${colors.border}`}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block",
                color: colors.text,
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.5rem"
              }}>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  color: colors.text,
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border 0.3s ease"
                }}
                onFocus={(e) => e.target.style.border = `1px solid ${colors.primary}`}
                onBlur={(e) => e.target.style.border = `1px solid ${colors.border}`}
              />
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              marginBottom: "1.5rem"
            }}>
              <div>
                <label style={{
                  display: "block",
                  color: colors.text,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem"
                }}>
                  Event Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.border = `1px solid ${colors.primary}`}
                  onBlur={(e) => e.target.style.border = `1px solid ${colors.border}`}
                />
              </div>

              <div>
                <label style={{
                  display: "block",
                  color: colors.text,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem"
                }}>
                  Event Type *
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border 0.3s ease",
                    cursor: "pointer"
                  }}
                  onFocus={(e) => e.target.style.border = `1px solid ${colors.primary}`}
                  onBlur={(e) => e.target.style.border = `1px solid ${colors.border}`}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              marginBottom: "1.5rem"
            }}>
              <div>
                <label style={{
                  display: "block",
                  color: colors.text,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem"
                }}>
                  Number of Guests *
                </label>
                <select
                  name="guestCount"
                  value={formData.guestCount}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border 0.3s ease",
                    cursor: "pointer"
                  }}
                  onFocus={(e) => e.target.style.border = `1px solid ${colors.primary}`}
                  onBlur={(e) => e.target.style.border = `1px solid ${colors.border}`}
                >
                  {guestCounts.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: "block",
                  color: colors.text,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem"
                }}>
                  Event Duration *
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border 0.3s ease",
                    cursor: "pointer"
                  }}
                  onFocus={(e) => e.target.style.border = `1px solid ${colors.primary}`}
                  onBlur={(e) => e.target.style.border = `1px solid ${colors.border}`}
                >
                  {durations.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block",
                color: colors.text,
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.5rem"
              }}>
                Selected Package *
              </label>
              <select
                name="package"
                value={formData.package}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  color: colors.text,
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border 0.3s ease",
                  cursor: "pointer"
                }}
                onFocus={(e) => e.target.style.border = `1px solid ${colors.primary}`}
                onBlur={(e) => e.target.style.border = `1px solid ${colors.border}`}
              >
                <option value="">Select a package</option>
                {gamePackages
                  .filter(pkg => pkg.category === formData.eventType)
                  .map((pkg) => (
                    <option key={pkg.id} value={pkg.name}>
                      {pkg.name} - {pkg.price}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block",
                color: colors.text,
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.5rem"
              }}>
                Selected Games (Optional)
              </label>
              <div style={{
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                padding: "1rem",
                minHeight: "60px"
              }}>
                {selectedGames.length === 0 ? (
                  <div style={{ color: colors.textLight, fontSize: "0.9rem" }}>
                    No games selected. Browse games above to add them.
                  </div>
                ) : (
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem"
                  }}>
                    {selectedGames.map((gameId) => {
                      const game = cardGames.find(g => g.id === gameId);
                      const gameName = game ? game.name : gameId;
                      return (
                        <div key={gameId} style={{
                          padding: "6px 12px",
                          background: colors.primary,
                          color: colors.dark,
                          borderRadius: "15px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}>
                          {gameName}
                          <button
                            type="button"
                            onClick={() => toggleGame(gameId)}
                            style={{
                              background: "none",
                              border: "none",
                              color: colors.dark,
                              cursor: "pointer",
                              fontSize: "1rem",
                              padding: 0,
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{
                display: "block",
                color: colors.text,
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.5rem"
              }}>
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Any special requests, dietary requirements, or specific game preferences..."
                style={{
                  width: "100%",
                  padding: "12px",
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  color: colors.text,
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border 0.3s ease",
                  resize: "vertical"
                }}
                onFocus={(e) => e.target.style.border = `1px solid ${colors.primary}`}
                onBlur={(e) => e.target.style.border = `1px solid ${colors.border}`}
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                color: colors.dark,
                border: "none",
                borderRadius: "8px",
                padding: "16px",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: submitLoading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                width: "100%",
                opacity: submitLoading ? 0.8 : 1
              }}
              onMouseEnter={(e) => {
                if (!submitLoading) {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(230, 126, 34, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!submitLoading) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {submitLoading ? (
                <>
                  <span style={{ marginRight: "8px" }}>⏳</span>
                  Processing Booking...
                </>
              ) : (
                <>
                  <span style={{ marginRight: "8px" }}>📅</span>
                  Book Your Event Now
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: "40px 20px",
        background: colors.dark,
        borderTop: `1px solid ${colors.border}`,
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h3 style={{
            color: colors.text,
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "1rem"
          }}>
            Joy Juncture Premium Card Games
          </h3>
          <p style={{
            color: colors.textLight,
            fontSize: "1rem",
            marginBottom: "2rem",
            maxWidth: "600px",
            margin: "0 auto 2rem"
          }}>
            Professional card game event planning for all celebrations. Let us make your event unforgettable!
          </p>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            flexWrap: "wrap"
          }}>
            <div style={{ color: colors.textLight }}>
              📞 +91 12345 67890
            </div>
            <div style={{ color: colors.textLight }}>
              ✉️ contact@joyjuncture.com
            </div>
            <div style={{ color: colors.textLight }}>
              📍 Mumbai, India
            </div>
          </div>
          <div style={{
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: `1px solid ${colors.border}`,
            color: colors.textLight,
            fontSize: "0.9rem"
          }}>
            © {new Date().getFullYear()} Joy Juncture. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}