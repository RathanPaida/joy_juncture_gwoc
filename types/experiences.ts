export interface CardGame {
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
  createdAt?: string;
  updatedAt?: string;
}

export interface GamePackage {
  id: string;
  name: string;
  price: string;
  duration: string;
  guestRange: string;
  includes: {
    food: string[];
    planning: string[];
    sound: string[];
    photography: string[];
    games: string[];
  };
  bestFor: string;
  color: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  eventType: string;
  guestCount: string;
  package: string;
  duration: string;
  selectedGames: string[];
  notes: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: "admin" | "user";
  createdAt: string;
}
