"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Edit, Plus, X, Save, Gamepad2, ArrowLeft, LogOut } from "lucide-react";
import { getAuth, getIdToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

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
  createdAt: string;
  updatedAt: string;
}

export default function AdminGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<CardGame[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<CardGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [gameForm, setGameForm] = useState({
    name: "",
    description: "",
    regularPrice: "",
    salePrice: "",
    category: [] as string[],
    players: "",
    duration: "",
    features: [""],
    imageUrl: ""
  });

  const colors = {
    primary: "#ff8c00",
    secondary: "#ffb347",
    dark: "#0b0b0b",
    light: "#121212",
    text: "#f5f5f5",
    textLight: "#b3b3b3",
    border: "#2a2a2a",
    background: "#141414",
    success: "#10b981",
    danger: "#ef4444"
  };

  const categories = [
    { id: "birthday-anniversary", name: "🎉 Birthdays & Anniversaries" },
    { id: "wedding", name: "💍 Weddings" },
    { id: "corporate-engagement", name: "💼 Corporate" },
    { id: "carnival-games", name: "🎪 Carnival" }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔐 Admin: Auth state changed:", firebaseUser?.email);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userToken = await getIdToken(firebaseUser);
          console.log("✅ Admin: Token obtained");
          setToken(userToken);
          setError(null);
          loadGames(userToken);
        } catch (error: any) {
          console.error("❌ Admin: Error getting token:", error);
          setError("Failed to get authentication token");
          setIsLoading(false);
        }
      } else {
        console.log("❌ Admin: No user logged in");
        setToken(null);
        setError("Please log in to access admin panel");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadGames = async (userToken?: string) => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      headers['Content-Type'] = 'application/json';

      const res = await fetch("/api/games", { headers });
      const data = await res.json();
      if (data.success) setGames(data.data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load games: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    if (!token) {
      alert("Please log in first");
      return;
    }
    
    setEditingGame(null);
    setGameForm({
      name: "",
      description: "",
      regularPrice: "",
      salePrice: "",
      category: [],
      players: "",
      duration: "",
      features: [""],
      imageUrl: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (game: CardGame) => {
    if (!token) {
      alert("Please log in first");
      return;
    }
    
    setEditingGame(game);
    setGameForm({ ...game });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGame(null);
  };

  const handleSave = async () => {
    if (!token) {
      alert("Please log in first");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const method = editingGame ? "PUT" : "POST";
      const body = editingGame
        ? JSON.stringify({ id: editingGame.id, ...gameForm })
        : JSON.stringify(gameForm);

      const res = await fetch("/api/games", {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body
      });

      const data = await res.json();
      if (data.success) {
        await loadGames(token);
        closeModal();
        alert(`✅ Game ${editingGame ? "updated" : "added"} successfully!`);
      } else {
        setError(data.error || `Failed to ${editingGame ? "update" : "add"} game`);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to save game: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token) {
      alert("Please log in first");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      setError(null);

      const res = await fetch(`/api/games?id=${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        await loadGames(token);
        alert("✅ Game deleted successfully!");
      } else {
        setError(data.error || "Failed to delete game");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete game: " + err.message);
    }
  };

  const handleCategoryToggle = (cat: string) => {
    setGameForm(prev => ({
      ...prev,
      category: prev.category.includes(cat)
        ? prev.category.filter(c => c !== cat)
        : [...prev.category, cat]
    }));
  };

  const addFeature = () => setGameForm(prev => ({ ...prev, features: [...prev.features, ""] }));
  const removeFeature = (i: number) => setGameForm(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));
  const updateFeature = (i: number, value: string) => setGameForm(prev => ({ ...prev, features: prev.features.map((f, idx) => idx === i ? value : f) }));

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshGames = () => {
    if (token) {
      loadGames(token);
    }
  };

  if (!user && !isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${colors.dark}, ${colors.light})`, color: colors.text, fontFamily: "system-ui,sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: colors.background, borderRadius: "12px", padding: "3rem", textAlign: "center", border: `2px solid ${colors.primary}`, maxWidth: "500px", width: "90%" }}>
          <Gamepad2 size={64} style={{ color: colors.primary, marginBottom: "1rem" }} />
          <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "1rem", background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Admin Access Required
          </h1>
          <p style={{ color: colors.textLight, marginBottom: "2rem" }}>Please log in to access the admin panel</p>
          <button 
            onClick={() => router.push("/login")}
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: colors.dark, border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", width: "100%" }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !user) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${colors.dark}, ${colors.light})`, color: colors.text, fontFamily: "system-ui,sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Gamepad2 size={48} className="animate-spin" style={{ color: colors.primary, marginBottom: "1rem" }} />
          <h2 style={{ color: colors.text }}>Loading Admin Panel...</h2>
          <p style={{ color: colors.textLight }}>Authenticating user</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${colors.dark}, ${colors.light})`, color: colors.text, fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <header style={{ background: colors.background, borderBottom: `2px solid ${colors.border}`, padding: "1.5rem 2rem", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button onClick={() => router.push("/admin")} style={{ background: colors.light, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Gamepad2 size={28} /> Manage Card Games
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.25rem" }}>
                <p style={{ color: colors.textLight, fontSize: "0.9rem" }}>Total Games: {games.length}</p>
                <p style={{ color: colors.textLight, fontSize: "0.9rem" }}>Logged in as: {user?.email}</p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button onClick={refreshGames} style={{ background: colors.light, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
              🔄 Refresh
            </button>
            <button onClick={openCreateModal} style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: colors.dark, border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Plus size={20} /> Add New Game
            </button>
            <button onClick={handleLogout} style={{ background: colors.danger, color: "white", border: "none", borderRadius: "8px", padding: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div style={{ maxWidth: "1400px", margin: "1rem auto", padding: "0 2rem" }}>
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: `1px solid ${colors.danger}`, color: colors.danger, padding: "12px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "transparent", border: "none", color: colors.danger, cursor: "pointer" }}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Game List */}
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: colors.textLight }}>Loading games...</div>
        ) : games.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <Gamepad2 size={64} style={{ color: colors.textLight, marginBottom: "1rem" }} />
            <h3 style={{ color: colors.text, marginBottom: "0.5rem" }}>No games yet</h3>
            <p style={{ color: colors.textLight }}>Click "Add New Game" to create your first card game</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: "1.5rem" }}>
            {games.map(game => (
              <div key={game.id} style={{ background: colors.background, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "1.5rem", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = `0 10px 30px ${colors.primary}40`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <h3 style={{ color: colors.text, fontSize: "1.2rem", fontWeight: 700, flex: 1 }}>{game.name}</h3>
                  {editingGame?.id === game.id && (
                    <span style={{ fontSize: "0.75rem", background: colors.primary, color: colors.dark, padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                      Editing...
                    </span>
                  )}
                </div>
                <p style={{ color: colors.textLight, fontSize: "0.9rem", marginBottom: "1rem", lineHeight: 1.5 }}>{game.description}</p>
                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ color: colors.textLight, textDecoration: "line-through", marginRight: "0.5rem", fontSize: "0.85rem" }}>{game.regularPrice}</span>
                  <span style={{ color: colors.primary, fontWeight: "bold", fontSize: "1.2rem" }}>{game.salePrice}</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  {game.category.map((cat, i) => {
                    const category = categories.find(c => c.id === cat);
                    return (
                      <span key={i} style={{ background: `${colors.primary}20`, color: colors.primary, padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>
                        {category?.name || cat}
                      </span>
                    );
                  })}
                </div>
                <div style={{ fontSize: "0.85rem", color: colors.textLight, marginBottom: "1rem" }}>{game.players} • {game.duration}</div>
                <div style={{ fontSize: "0.85rem", color: colors.textLight, marginBottom: "1rem" }}>
                  Created: {new Date(game.createdAt).toLocaleDateString()}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => openEditModal(game)} style={{ flex: 1, background: colors.success, color: "white", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontWeight: 600 }}><Edit size={16} /> Edit</button>
                  <button onClick={() => handleDelete(game.id, game.name)} style={{ flex: 1, background: colors.danger, color: "white", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontWeight: 600 }}><Trash2 size={16} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "2rem" }}>
          <div style={{ background: colors.background, borderRadius: "12px", padding: "2rem", maxWidth: "600px", width: "100%", maxHeight: "85vh", overflow: "auto", border: `2px solid ${colors.primary}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem", alignItems: "center" }}>
              <h2 style={{ color: colors.text, fontSize: "1.5rem", fontWeight: 700 }}>{editingGame ? "Edit Game" : "Add New Game"}</h2>
              <button onClick={closeModal} style={{ background: "transparent", border: "none", color: colors.text, cursor: "pointer" }}><X size={24} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Name */}
              <div>
                <label style={{ display: "block", color: colors.text, marginBottom: "0.5rem", fontWeight: 600 }}>Game Name *</label>
                <input type="text" value={gameForm.name} onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })} placeholder="e.g., Dead Man's Deck"
                  style={{ width: "100%", padding: "12px", background: colors.light, border: `1px solid ${colors.border}`, borderRadius: "8px", color: colors.text, fontSize: "1rem" }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", color: colors.text, marginBottom: "0.5rem", fontWeight: 600 }}>Description *</label>
                <textarea value={gameForm.description} onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })} placeholder="Brief description..." rows={3}
                  style={{ width: "100%", padding: "12px", background: colors.light, border: `1px solid ${colors.border}`, borderRadius: "8px", color: colors.text, fontSize: "1rem", resize: "vertical" }}
                />
              </div>

              {/* Prices */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", color: colors.text, marginBottom: "0.5rem", fontWeight: 600 }}>Regular Price *</label>
                  <input type="text" value={gameForm.regularPrice} onChange={(e) => setGameForm({ ...gameForm, regularPrice: e.target.value })} placeholder="Rs. 799.00"
                    style={{ width: "100%", padding: "12px", background: colors.light, border: `1px solid ${colors.border}`, borderRadius: "8px", color: colors.text, fontSize: "1rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: colors.text, marginBottom: "0.5rem", fontWeight: 600 }}>Sale Price *</label>
                  <input type="text" value={gameForm.salePrice} onChange={(e) => setGameForm({ ...gameForm, salePrice: e.target.value })} placeholder="Rs. 599.00"
                    style={{ width: "100%", padding: "12px", background: colors.light, border: `1px solid ${colors.border}`, borderRadius: "8px", color: colors.text, fontSize: "1rem" }}
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label style={{ display: "block", color: colors.text, marginBottom: "0.5rem", fontWeight: 600 }}>Categories *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {categories.map(cat => (
                    <button key={cat.id} type="button" onClick={() => handleCategoryToggle(cat.id)}
                      style={{ background: gameForm.category.includes(cat.id) ? colors.primary : colors.light, color: gameForm.category.includes(cat.id) ? colors.dark : colors.text, border: `1px solid ${gameForm.category.includes(cat.id) ? colors.primary : colors.border}`, borderRadius: "6px", padding: "8px 12px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                    >{cat.name}</button>
                  ))}
                </div>
              </div>

              {/* Players & Duration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", color: colors.text, marginBottom: "0.5rem", fontWeight: 600 }}>Players *</label>
                  <input type="text" value={gameForm.players} onChange={(e) => setGameForm({ ...gameForm, players: e.target.value })} placeholder="4-8 Players"
                    style={{ width: "100%", padding: "12px", background: colors.light, border: `1px solid ${colors.border}`, borderRadius: "8px", color: colors.text, fontSize: "1rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: colors.text, marginBottom: "0.5rem", fontWeight: 600 }}>Duration *</label>
                  <input type="text" value={gameForm.duration} onChange={(e) => setGameForm({ ...gameForm, duration: e.target.value })} placeholder="60-90 mins"
                    style={{ width: "100%", padding: "12px", background: colors.light, border: `1px solid ${colors.border}`, borderRadius: "8px", color: colors.text, fontSize: "1rem" }}
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label style={{ display: "block", color: colors.text, marginBottom: "0.5rem", fontWeight: 600 }}>Features *</label>
                {gameForm.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <input type="text" value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder="Feature..."
                      style={{ flex: 1, padding: "10px", background: colors.light, border: `1px solid ${colors.border}`, borderRadius: "6px", color: colors.text }}
                    />
                    <button type="button" onClick={() => removeFeature(i)} style={{ background: colors.danger, color: "white", border: "none", borderRadius: "6px", padding: "0 12px", cursor: "pointer" }}><X size={18} /></button>
                  </div>
                ))}
                <button type="button" onClick={addFeature} style={{ marginTop: "0.5rem", background: colors.primary, color: colors.dark, border: "none", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}><Plus size={16} /> Add Feature</button>
              </div>

              {/* Image URL */}
              <div>
                <label style={{ display: "block", color: colors.text, marginBottom: "0.5rem", fontWeight: 600 }}>Image URL *</label>
                <input type="text" value={gameForm.imageUrl} onChange={(e) => setGameForm({ ...gameForm, imageUrl: e.target.value })} placeholder="https://example.com/image.jpg"
                  style={{ width: "100%", padding: "12px", background: colors.light, border: `1px solid ${colors.border}`, borderRadius: "8px", color: colors.text, fontSize: "1rem" }}
                />
              </div>

              {/* Save */}
              <button 
                onClick={handleSave} 
                disabled={isSubmitting}
                style={{ 
                  marginTop: "1rem", 
                  background: isSubmitting ? colors.textLight : colors.success, 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px", 
                  padding: "12px 24px", 
                  fontWeight: 700, 
                  fontSize: "1rem", 
                  cursor: isSubmitting ? "not-allowed" : "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "0.5rem",
                  opacity: isSubmitting ? 0.7 : 1 
                }}
              >
                {isSubmitting ? "Saving..." : <><Save size={18} /> Save Game</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}