// lib/api-client.ts
import type { CardGame, GamePackage, Booking, User } from "@/types/experiences";

// Base API client
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  }

  private async getAuthToken(): Promise<string | null> {
    // Try to get token from localStorage for client-side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth-token");
      if (token) return token;
    }

    // For server-side or if no token in localStorage
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "An error occurred",
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Card Games API
  async getCardGames(): Promise<CardGame[]> {
    return this.request<CardGame[]>("/games");
  }

  async getCardGame(id: string): Promise<CardGame> {
    return this.request<CardGame>(`/games/${id}`);
  }

  async createCardGame(
    game: Omit<CardGame, "id" | "createdAt" | "updatedAt">,
  ): Promise<CardGame> {
    return this.request<CardGame>("/games", {
      method: "POST",
      body: JSON.stringify(game),
    });
  }

  async updateCardGame(id: string, game: Partial<CardGame>): Promise<CardGame> {
    return this.request<CardGame>(`/games/${id}`, {
      method: "PUT",
      body: JSON.stringify(game),
    });
  }

  async deleteCardGame(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/games/${id}`, {
      method: "DELETE",
    });
  }

  // Game Packages API
  async getGamePackages(): Promise<GamePackage[]> {
    return this.request<GamePackage[]>("/packages");
  }

  async getGamePackage(id: string): Promise<GamePackage> {
    return this.request<GamePackage>(`/packages/${id}`);
  }

  async createGamePackage(
    pkg: Omit<GamePackage, "id" | "createdAt" | "updatedAt">,
  ): Promise<GamePackage> {
    return this.request<GamePackage>("/packages", {
      method: "POST",
      body: JSON.stringify(pkg),
    });
  }

  async updateGamePackage(
    id: string,
    pkg: Partial<GamePackage>,
  ): Promise<GamePackage> {
    return this.request<GamePackage>(`/packages/${id}`, {
      method: "PUT",
      body: JSON.stringify(pkg),
    });
  }

  async deleteGamePackage(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/packages/${id}`, {
      method: "DELETE",
    });
  }

  // Bookings API
  async getBookings(): Promise<Booking[]> {
    return this.request<Booking[]>("/bookings");
  }

  async getBooking(id: string): Promise<Booking> {
    return this.request<Booking>(`/bookings/${id}`);
  }

  async createBooking(
    booking: Omit<Booking, "id" | "createdAt" | "status">,
  ): Promise<Booking> {
    return this.request<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(booking),
    });
  }

  async updateBooking(id: string, booking: Partial<Booking>): Promise<Booking> {
    return this.request<Booking>(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(booking),
    });
  }

  async deleteBooking(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/bookings/${id}`, {
      method: "DELETE",
    });
  }

  // Users API (Admin only)
  async getUsers(): Promise<User[]> {
    return this.request<User[]>("/users");
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/users/${id}`, {
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
