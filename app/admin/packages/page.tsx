"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Edit,
  Plus,
  X,
  Save,
  Package,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import {
  getAuth,
  getIdToken,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { app } from "@/lib/firebase";

const auth = getAuth(app);

interface GamePackage {
  id: string;
  name: string;
  price: string;
  duration: string;
  guestRange: string;
  category: string;
  includes: {
    food?: string[];
    planning?: string[];
    sound?: string[];
    photography?: string[];
    games?: string[];
  };
  bestFor: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminPackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<GamePackage | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [packageForm, setPackageForm] = useState({
    name: "",
    price: "",
    duration: "",
    guestRange: "",
    bestFor: "",
    color: "#ff8c00",
    category: "",
    includes: {
      food: [""],
      planning: [""],
      sound: [""],
      photography: [""],
      games: [""],
    },
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
    danger: "#ef4444",
  };

  const categories = [
    { id: "birthday-anniversary", name: "🎉 Birthday & Anniversary" },
    { id: "wedding", name: "💍 Wedding" },
    { id: "corporate-engagement", name: "💼 Corporate" },
    { id: "carnival-games", name: "🎪 Carnival" },
  ];

  const colorOptions = [
    { value: "#ff8c00", name: "Orange" },
    { value: "#ffcc00", name: "Gold" },
    { value: "#4ecdc4", name: "Teal" },
    { value: "#9b59b6", name: "Purple" },
    { value: "#e74c3c", name: "Red" },
    { value: "#3498db", name: "Blue" },
  ];

  // Helper function to generate unique key for each package
  const getPackageKey = (pkg: GamePackage, index: number): string => {
    // If package has a valid id, use it
    if (pkg.id && pkg.id.trim() !== "") {
      return pkg.id;
    }
    // Otherwise generate a unique key based on name and index
    return `package-${pkg.name}-${index}-${Date.now()}`;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "🔐 Admin Packages: Auth state changed:",
        firebaseUser?.email,
      );
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userToken = await getIdToken(firebaseUser);
          console.log("✅ Admin Packages: Token obtained");
          setToken(userToken);
          setError(null);
          loadPackages(userToken);
        } catch (error: any) {
          console.error("❌ Admin Packages: Error getting token:", error);
          setError("Failed to get authentication token");
          setIsLoading(false);
        }
      } else {
        console.log("❌ Admin Packages: No user logged in");
        setToken(null);
        setError("Please log in to access admin panel");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadPackages = async (userToken?: string) => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = {};
      if (userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }
      headers["Content-Type"] = "application/json";

      const res = await fetch("/api/packages", { headers });
      const data = await res.json();

      console.log("📦 Packages API Response:", data);

      if (data.success && Array.isArray(data.data)) {
        // Transform data to ensure includes structure is consistent
        const transformedPackages = data.data.map((pkg: any, index: number) => {
          // Ensure each package has a unique id
          const packageWithId = {
            ...pkg,
            id: pkg.id || `package-${index}-${Date.now()}`,
          };

          return {
            ...packageWithId,
            includes: {
              food: Array.isArray(pkg.includes?.food)
                ? pkg.includes.food.filter(Boolean)
                : [],
              planning: Array.isArray(pkg.includes?.planning)
                ? pkg.includes.planning.filter(Boolean)
                : [],
              sound: Array.isArray(pkg.includes?.sound)
                ? pkg.includes.sound.filter(Boolean)
                : [],
              photography: Array.isArray(pkg.includes?.photography)
                ? pkg.includes.photography.filter(Boolean)
                : [],
              games: Array.isArray(pkg.includes?.games)
                ? pkg.includes.games.filter(Boolean)
                : [],
            },
          };
        });

        console.log("✅ Transformed Packages:", transformedPackages);
        setPackages(transformedPackages);
      } else {
        console.error("❌ Failed to load packages:", data.error);
        setError(data.error || "Failed to load packages");
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load packages: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    if (!token) {
      alert("Please log in first");
      return;
    }

    setEditingPackage(null);
    setPackageForm({
      name: "",
      price: "",
      duration: "",
      guestRange: "",
      bestFor: "",
      color: "#ff8c00",
      category: "",
      includes: {
        food: [""],
        planning: [""],
        sound: [""],
        photography: [""],
        games: [""],
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: GamePackage) => {
    if (!token) {
      alert("Please log in first");
      return;
    }

    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      guestRange: pkg.guestRange,
      bestFor: pkg.bestFor,
      color: pkg.color,
      category: pkg.category,
      includes: {
        food: pkg.includes?.food?.length ? pkg.includes.food : [""],
        planning: pkg.includes?.planning?.length ? pkg.includes.planning : [""],
        sound: pkg.includes?.sound?.length ? pkg.includes.sound : [""],
        photography: pkg.includes?.photography?.length
          ? pkg.includes.photography
          : [""],
        games: pkg.includes?.games?.length ? pkg.includes.games : [""],
      },
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
  };

  const handleSave = async () => {
    if (!token) {
      alert("Please log in first");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Filter out empty include items
      const filteredIncludes = {
        food: packageForm.includes.food.filter((item) => item.trim() !== ""),
        planning: packageForm.includes.planning.filter(
          (item) => item.trim() !== "",
        ),
        sound: packageForm.includes.sound.filter((item) => item.trim() !== ""),
        photography: packageForm.includes.photography.filter(
          (item) => item.trim() !== "",
        ),
        games: packageForm.includes.games.filter((item) => item.trim() !== ""),
      };

      const packageData = {
        ...packageForm,
        includes: filteredIncludes,
      };

      const method = editingPackage ? "PUT" : "POST";
      const body = editingPackage
        ? JSON.stringify({ id: editingPackage.id, ...packageData })
        : JSON.stringify(packageData);

      console.log("📤 Saving package:", packageData);

      const res = await fetch("/api/packages", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const data = await res.json();

      if (data.success) {
        await loadPackages(token);
        closeModal();
        alert(
          `✅ Package ${editingPackage ? "updated" : "added"} successfully!`,
        );
      } else {
        setError(
          data.error ||
            `Failed to ${editingPackage ? "update" : "add"} package`,
        );
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to save package: " + err.message);
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

      const res = await fetch(`/api/packages?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        await loadPackages(token);
        alert("✅ Package deleted successfully!");
      } else {
        setError(data.error || "Failed to delete package");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete package: " + err.message);
    }
  };

  const addIncludeItem = (field: keyof typeof packageForm.includes) => {
    setPackageForm((prev) => ({
      ...prev,
      includes: {
        ...prev.includes,
        [field]: [...prev.includes[field], ""],
      },
    }));
  };

  const removeIncludeItem = (
    field: keyof typeof packageForm.includes,
    index: number,
  ) => {
    setPackageForm((prev) => ({
      ...prev,
      includes: {
        ...prev.includes,
        [field]: prev.includes[field].filter((_, i) => i !== index),
      },
    }));
  };

  const updateIncludeItem = (
    field: keyof typeof packageForm.includes,
    index: number,
    value: string,
  ) => {
    setPackageForm((prev) => ({
      ...prev,
      includes: {
        ...prev.includes,
        [field]: prev.includes[field].map((v, i) => (i === index ? value : v)),
      },
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshPackages = () => {
    if (token) {
      loadPackages(token);
    }
  };

  if (!user && !isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${colors.dark}, ${colors.light})`,
          color: colors.text,
          fontFamily: "system-ui,sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: colors.background,
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            border: `2px solid ${colors.primary}`,
            maxWidth: "500px",
            width: "90%",
          }}
        >
          <Package
            size={64}
            style={{ color: colors.primary, marginBottom: "1rem" }}
          />
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Admin Access Required
          </h1>
          <p style={{ color: colors.textLight, marginBottom: "2rem" }}>
            Please log in to access the admin panel
          </p>
          <button
            onClick={() => router.push("/login")}
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              color: colors.dark,
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${colors.dark}, ${colors.light})`,
          color: colors.text,
          fontFamily: "system-ui,sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Package
            size={48}
            className="animate-spin"
            style={{ color: colors.primary, marginBottom: "1rem" }}
          />
          <h2 style={{ color: colors.text }}>Loading Admin Panel...</h2>
          <p style={{ color: colors.textLight }}>Authenticating user</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.light} 100%)`,
        color: colors.text,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: colors.background,
          borderBottom: `2px solid ${colors.border}`,
          padding: "1.5rem 2rem",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => router.push("/admin")}
              style={{
                background: colors.light,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                padding: "10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Package size={28} /> Manage Packages
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginTop: "0.25rem",
                }}
              >
                <p style={{ color: colors.textLight, fontSize: "0.9rem" }}>
                  Total Packages: {packages.length}
                </p>
                <p style={{ color: colors.textLight, fontSize: "0.9rem" }}>
                  Logged in as: {user?.email}
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={refreshPackages}
              style={{
                background: colors.light,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                padding: "10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={openCreateModal}
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: colors.dark,
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Plus size={20} /> Add New Package
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: colors.danger,
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div
          style={{ maxWidth: "1400px", margin: "1rem auto", padding: "0 2rem" }}
        >
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${colors.danger}`,
              color: colors.danger,
              padding: "12px",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: "transparent",
                border: "none",
                color: colors.danger,
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Package Cards */}
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem",
              color: colors.textLight,
            }}
          >
            Loading packages...
          </div>
        ) : packages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <Package
              size={64}
              style={{ color: colors.textLight, marginBottom: "1rem" }}
            />
            <h3 style={{ color: colors.text, marginBottom: "0.5rem" }}>
              No packages yet
            </h3>
            <p style={{ color: colors.textLight }}>
              Click "Add New Package" to create your first package
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "2rem",
            }}
          >
            {packages.map((pkg, index) => {
              // Use the helper function to get a unique key
              const uniqueKey = getPackageKey(pkg, index);

              return (
                <div
                  key={uniqueKey}
                  style={{
                    background: colors.background,
                    border: `2px solid ${pkg.color}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = `0 15px 40px ${pkg.color}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      background: pkg.color,
                      padding: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    <h3
                      style={{
                        color: colors.dark,
                        fontSize: "1.3rem",
                        marginBottom: "0.5rem",
                        fontWeight: 800,
                      }}
                    >
                      {pkg.name}
                    </h3>
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        color: colors.dark,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {pkg.price}
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: colors.dark,
                        fontWeight: 600,
                      }}
                    >
                      {pkg.duration} • {pkg.guestRange}
                    </div>
                  </div>
                  <div style={{ padding: "1.5rem" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: colors.light,
                          color: colors.text,
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {categories.find((c) => c.id === pkg.category)?.name ||
                          pkg.category}
                      </span>
                      {pkg.bestFor && (
                        <span
                          style={{
                            background: `${pkg.color}20`,
                            color: pkg.color,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {pkg.bestFor}
                        </span>
                      )}
                    </div>

                    {/* Created Date */}
                    {pkg.createdAt && (
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: colors.textLight,
                          marginBottom: "1rem",
                        }}
                      >
                        Created: {new Date(pkg.createdAt).toLocaleDateString()}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => openEditModal(pkg)}
                        style={{
                          flex: 1,
                          background: colors.success,
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          fontWeight: 600,
                        }}
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id, pkg.name)}
                        style={{
                          flex: 1,
                          background: colors.danger,
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          fontWeight: 600,
                        }}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: colors.background,
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "85vh",
              overflow: "auto",
              border: `2px solid ${colors.primary}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2rem",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  color: colors.text,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                {editingPackage ? "Edit Package" : "Add New Package"}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: "transparent",
                  border: "none",
                  color: colors.text,
                  cursor: "pointer",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Basic Info */}
              <div>
                <label
                  style={{
                    display: "block",
                    color: colors.text,
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Name *
                </label>
                <input
                  type="text"
                  value={packageForm.name}
                  onChange={(e) =>
                    setPackageForm({ ...packageForm, name: e.target.value })
                  }
                  placeholder="Package Name"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.light,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      color: colors.text,
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                    }}
                  >
                    Price *
                  </label>
                  <input
                    type="text"
                    value={packageForm.price}
                    onChange={(e) =>
                      setPackageForm({ ...packageForm, price: e.target.value })
                    }
                    placeholder="₹ 1499"
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: colors.light,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      color: colors.text,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: colors.text,
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                    }}
                  >
                    Duration *
                  </label>
                  <input
                    type="text"
                    value={packageForm.duration}
                    onChange={(e) =>
                      setPackageForm({
                        ...packageForm,
                        duration: e.target.value,
                      })
                    }
                    placeholder="3-5 hours"
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: colors.light,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      color: colors.text,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    color: colors.text,
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Guest Range *
                </label>
                <input
                  type="text"
                  value={packageForm.guestRange}
                  onChange={(e) =>
                    setPackageForm({
                      ...packageForm,
                      guestRange: e.target.value,
                    })
                  }
                  placeholder="50-100 guests"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.light,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    color: colors.text,
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Best For
                </label>
                <input
                  type="text"
                  value={packageForm.bestFor}
                  onChange={(e) =>
                    setPackageForm({ ...packageForm, bestFor: e.target.value })
                  }
                  placeholder="Weddings, Birthdays..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.light,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    color: colors.text,
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Category *
                </label>
                <select
                  value={packageForm.category}
                  onChange={(e) =>
                    setPackageForm({ ...packageForm, category: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.light,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    color: colors.text,
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Color
                </label>
                <select
                  value={packageForm.color}
                  onChange={(e) =>
                    setPackageForm({ ...packageForm, color: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: colors.light,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                  }}
                >
                  {colorOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Includes Sections */}
              {(
                ["food", "planning", "sound", "photography", "games"] as const
              ).map((section) => (
                <div key={section}>
                  <label
                    style={{
                      display: "block",
                      color: colors.text,
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                    }}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)} Items
                  </label>
                  {packageForm.includes[section].map((item, idx) => (
                    <div
                      key={`${section}-${idx}`}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <input
                        type="text"
                        value={item}
                        onChange={(e) =>
                          updateIncludeItem(section, idx, e.target.value)
                        }
                        placeholder={`Add ${section} item`}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: colors.light,
                          border: `1px solid ${colors.border}`,
                          borderRadius: "8px",
                          color: colors.text,
                        }}
                      />
                      {packageForm.includes[section].length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIncludeItem(section, idx)}
                          style={{
                            background: colors.danger,
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "10px",
                            cursor: "pointer",
                          }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addIncludeItem(section)}
                    style={{
                      background: colors.success,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Plus size={14} /> Add {section} item
                  </button>
                </div>
              ))}

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    background: colors.border,
                    color: colors.text,
                    border: "none",
                    borderRadius: "8px",
                    padding: "14px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    background: isSubmitting
                      ? colors.textLight
                      : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: colors.dark,
                    border: "none",
                    borderRadius: "8px",
                    padding: "14px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save size={18} /> Save Package
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
