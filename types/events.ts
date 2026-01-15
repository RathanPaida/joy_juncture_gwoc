// types/event.ts - Shared event types for the application

export interface Event {
  _id: string;
  name: string;
  description: string;
  detailedDescription: string; // Required for EventCard
  date: string;
  time: string; // Required - defaults to empty string
  price: number;
  coins: number;
  registrationLink: string; // Required - defaults to empty string
  Venue: string; // Required - defaults to empty string
  venue: string; // Required - defaults to empty string
  address: string; // Required - defaults to empty string
  collabWith: string; // Required - defaults to empty string
  isActive: boolean;
  imageUrl: string; // Required - defaults to empty string
  totalSeats?: number;
  availableSeats?: number;
}

export interface EventAPIResponse {
  events?: Event[];
  success?: boolean;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface EventCardProps {
  event: Event;
  isUpcoming?: boolean;
  user?: any;
  onRegisterSuccess?: () => void;
}

export interface EventFormData {
  name: string;
  description: string;
  detailedDescription: string;
  date: string;
  time: string;
  Venue: string;
  venue: string;
  address: string;
  price: number;
  coins: number;
  totalSeats?: number;
  availableSeats?: number;
  collabWith: string;
  registrationLink: string;
  imageUrl: string;
  isActive: boolean;
}