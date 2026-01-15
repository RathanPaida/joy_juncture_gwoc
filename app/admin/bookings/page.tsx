"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Edit, Check, X, Plus, ArrowLeft } from "lucide-react";
import { getAuth, getIdToken, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";


const auth = getAuth(app);


interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  package: string;
  date: string;
  status: string;
  consulted: boolean;
  createdAt: string;
  _id?: string; // MongoDB ID
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    package: "",
    date: "",
    status: "pending", // Default to "pending"
    consulted: false,
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

  // CORRECTED: Match backend Mongoose schema enum values
  const statusOptions = [
    { value: "pending", label: "Pending", color: colors.primary },
    { value: "confirmed", label: "Confirmed", color: colors.success }, // Changed from "approved" to "confirmed"
    { value: "completed", label: "Completed", color: "#3b82f6" }, // Added "completed" status
    { value: "cancelled", label: "Cancelled", color: colors.danger },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "🔐 Admin Bookings: Auth state changed:",
        firebaseUser?.email,
      );
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userToken = await getIdToken(firebaseUser);
          console.log("✅ Admin Bookings: Token obtained");
          setToken(userToken);
          setError(null);
          loadBookings(userToken);
        } catch (error: any) {
          console.error("❌ Admin Bookings: Error getting token:", error);
          setError("Failed to get authentication token");
          setIsLoading(false);
        }
      } else {
        console.log("❌ Admin Bookings: No user logged in");
        setToken(null);
        setError("Please log in to access admin panel");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadBookings = async (userToken?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }
      headers["Content-Type"] = "application/json";

      console.log("📅 Loading bookings with token:", userToken ? "Yes" : "No");

      const res = await fetch("/api/bookings", { headers });
      const data = await res.json();

      console.log("📅 Bookings API Response:", data);

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        if (res.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (data.success && Array.isArray(data.data)) {
        const transformedBookings = data.data.map((booking: any) => ({
          ...booking,
          id: booking._id?.toString() || booking.id || `booking-${Date.now()}`,
          name: booking.name || "",
          email: booking.email || "",
          phone: booking.phone || "",
          package: booking.package || "",
          date: booking.date || "",
          status: booking.status || "pending",
          consulted: booking.consulted || false,
          createdAt: booking.createdAt || new Date().toISOString(),
        }));

        console.log(`✅ Loaded ${transformedBookings.length} bookings`);
        setBookings(transformedBookings);
      } else {
        throw new Error(data.error || "Invalid response format");
      }
    } catch (err: any) {
      console.error("❌ Load bookings error:", err);
      setError(err.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (booking: Booking) => {
    if (!token) {
      alert("Please log in first");
      return;
    }

    setEditingBooking(booking);
    setForm({
      name: booking.name || "",
      email: booking.email || "",
      phone: booking.phone || "",
      package: booking.package || "",
      date: booking.date || "",
      status: booking.status || "pending",
      consulted: booking.consulted || false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingBooking(null);
    setIsModalOpen(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!token) {
      alert("Please log in first");
      return;
    }

    try {
      setError(null);

      const method = editingBooking ? "PUT" : "POST";
      const body = editingBooking
        ? JSON.stringify({ id: editingBooking.id, ...form })
        : JSON.stringify(form);

      console.log("💾 Saving booking:", {
        method,
        editingBooking: editingBooking?.id,
        body,
      });

      const res = await fetch("/api/bookings", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      console.log(
        "💾 Save booking response status:",
        res.status,
        res.statusText,
      );

      let data;
      try {
        const text = await res.text();
        console.log("💾 Save booking raw response:", text);

        if (text) {
          data = JSON.parse(text);
        } else {
          data = {};
        }
      } catch (jsonError) {
        console.error("💾 Failed to parse JSON response:", jsonError);
        throw new Error(
          `Server returned invalid response. Status: ${res.status} ${res.statusText}`,
        );
      }

      if (!res.ok) {
        console.log("💾 Error response data:", data);

        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;

        if (data) {
          if (data.error) {
            errorMessage = data.error;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.errors) {
            if (typeof data.errors === "object") {
              const errorMessages = Object.keys(data.errors).map((key) => {
                const err = data.errors[key];
                return `${key}: ${err.message || err}`;
              });
              errorMessage = `Validation error: ${errorMessages.join(", ")}`;
            } else {
              errorMessage = `Validation error: ${data.errors}`;
            }
          } else if (data._message) {
            errorMessage = data._message;
          } else if (typeof data === "string") {
            errorMessage = data;
          }
        }

        throw new Error(errorMessage);
      }

      if (data.success) {
        await loadBookings(token);
        closeModal();
        alert(
          `✅ Booking ${editingBooking ? "updated" : "created"} successfully!`,
        );
      } else {
        throw new Error(data.error || "Failed to save booking");
      }
    } catch (err: any) {
      console.error("❌ Save booking error:", err);
      const errorMsg = err.message || "Failed to save booking";
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) {
      alert("Please log in first");
      return;
    }

    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      setError(null);

      const res = await fetch(`/api/bookings?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (data.success) {
        await loadBookings(token);
        alert("✅ Booking deleted successfully!");
      } else {
        throw new Error(data.error || "Failed to delete booking");
      }
    } catch (err: any) {
      console.error("❌ Delete booking error:", err);
      setError(err.message || "Failed to delete booking");
    }
  };

  const toggleConsulted = async (booking: Booking) => {
    if (!token) {
      alert("Please log in first");
      return;
    }

    try {
      setError(null);

      const updated = { ...booking, consulted: !booking.consulted };
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: booking.id, consulted: updated.consulted }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (data.success) {
        await loadBookings(token);
      } else {
        throw new Error(data.error || "Failed to update consultation status");
      }
    } catch (err: any) {
      console.error("❌ Toggle consulted error:", err);
      setError(err.message || "Failed to update consultation status");
    }
  };

  const refreshBookings = () => {
    if (token) {
      loadBookings(token);
    }
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    if (option) return option.color;

    // Fallback colors
    switch (status.toLowerCase()) {
      case "confirmed":
        return colors.success;
      case "pending":
        return colors.primary;
      case "completed":
        return "#3b82f6"; // blue
      case "cancelled":
        return colors.danger;
      default:
        return colors.textLight;
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
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
            Please log in to access the bookings panel
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
          <div
            style={{
              fontSize: "48px",
              marginBottom: "1rem",
              animation: "spin 1s linear infinite",
            }}
          >
            ⏳
          </div>
          <h2 style={{ color: colors.text }}>Loading Admin Panel...</h2>
          <p style={{ color: colors.textLight }}>Authenticating user</p>
          <style jsx>{`
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        color: colors.text,
        fontFamily: "system-ui, sans-serif",
      }}
    >
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
                }}
              >
                Bookings
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
                  Total: {bookings.length}
                </p>
                {user && (
                  <p style={{ color: colors.textLight, fontSize: "0.9rem" }}>
                    User: {user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={refreshBookings}
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
              onClick={() => {
                setEditingBooking(null);
                setForm({
                  name: "",
                  email: "",
                  phone: "",
                  package: "",
                  date: "",
                  status: "pending",
                  consulted: false,
                });
                setIsModalOpen(true);
              }}
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
              <Plus size={20} /> Add Booking
            </button>
          </div>
        </div>
      </header>

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

      <main
        style={{ maxWidth: "1400px", margin: "2rem auto", padding: "0 2rem" }}
      >
        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem",
              color: colors.textLight,
            }}
          >
            <div
              style={{
                fontSize: "32px",
                marginBottom: "1rem",
                animation: "spin 1s linear infinite",
              }}
            >
              ⏳
            </div>
            Loading bookings...
            <style jsx>{`
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "1rem",
                color: colors.textLight,
              }}
            >
              📅
            </div>
            <h3 style={{ color: colors.text, marginBottom: "0.5rem" }}>
              No bookings found
            </h3>
            <p style={{ color: colors.textLight }}>
              Click "Add Booking" to create your first booking
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {bookings.map((booking) => (
              <div
                key={booking.id}
                style={{
                  background: colors.light,
                  borderRadius: "12px",
                  padding: "1.5rem",
                  border: `2px solid ${getStatusColor(booking.status)}`,
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 25px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {booking.name}
                    </h3>
                    <p style={{ color: colors.textLight, fontSize: "0.85rem" }}>
                      {booking.email}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: colors.textLight,
                        marginBottom: "0.25rem",
                      }}
                    >
                      {formatDate(booking.createdAt)}
                    </span>
                    <span
                      style={{
                        background: getStatusColor(booking.status),
                        color: colors.dark,
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                      }}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                    <span style={{ color: colors.textLight }}>📞</span>{" "}
                    {booking.phone}
                  </p>
                  <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                    <span style={{ color: colors.textLight }}>📦</span>{" "}
                    {booking.package}
                  </p>
                  <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                    <span style={{ color: colors.textLight }}>📅</span>{" "}
                    {booking.date}
                  </p>
                  <p style={{ fontSize: "0.9rem" }}>
                    <span style={{ color: colors.textLight }}>💬</span>
                    <span
                      style={{
                        color: booking.consulted
                          ? colors.success
                          : colors.danger,
                        marginLeft: "4px",
                      }}
                    >
                      {booking.consulted ? "Consulted ✓" : "Not Consulted"}
                    </span>
                  </p>
                </div>

                <div
                  style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}
                >
                  <button
                    onClick={() => openEditModal(booking)}
                    style={{
                      flex: 1,
                      background: colors.primary,
                      color: colors.dark,
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(booking.id)}
                    style={{
                      flex: 1,
                      background: colors.danger,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  <button
                    onClick={() => toggleConsulted(booking)}
                    style={{
                      flex: 1,
                      background: booking.consulted
                        ? colors.border
                        : colors.success,
                      color: booking.consulted ? colors.text : colors.dark,
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                  >
                    <Check size={14} />{" "}
                    {booking.consulted ? "Mark Unconsulted" : "Consulted"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: colors.background,
              borderRadius: "12px",
              padding: "2rem",
              width: "90%",
              maxWidth: "500px",
              border: `2px solid ${colors.primary}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {editingBooking ? "Edit Booking" : "Add New Booking"}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: "transparent",
                  border: "none",
                  color: colors.textLight,
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
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  background: colors.light,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "1rem",
                }}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  background: colors.light,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "1rem",
                }}
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{
                  background: colors.light,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "1rem",
                }}
                required
              />
              <input
                type="text"
                placeholder="Package"
                value={form.package}
                onChange={(e) => setForm({ ...form, package: e.target.value })}
                style={{
                  background: colors.light,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "1rem",
                }}
                required
              />
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={{
                  background: colors.light,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "1rem",
                }}
                required
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{
                  background: colors.light,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "1rem",
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: colors.textLight,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.consulted}
                  onChange={(e) =>
                    setForm({ ...form, consulted: e.target.checked })
                  }
                  style={{ width: "18px", height: "18px" }}
                />
                Consulted
              </label>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${colors.danger}`,
                  color: colors.danger,
                  padding: "10px",
                  borderRadius: "6px",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: colors.dark,
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {editingBooking ? "Update Booking" : "Create Booking"}
              </button>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  background: colors.light,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  padding: "12px",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
