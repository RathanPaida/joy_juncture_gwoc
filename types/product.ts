export interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  story: string;
  price: {
    amount: number;
    currency: string;
  };
  points: {
    purchase: number;
  };
  media: {
    thumbnail: string;
    images: string[];
    video?: {
      url: string;
      provider: string;
    };
  };
  meta: {
    players: string;
    duration: string;
    age: string;
    difficulty: string;
    badges: string[];
    moods: string[];
  };
  howToPlay: {
    setup: string;
    gameplay: string;
    winning: string;
  };
  keyFeatures?: string[];
  faqs?: {
    question: string;
    answer: string;
  }[];
  whatYouGet?: string[];
  category: string[];
  relatedSlugs?: string[];
  stock?: {
    available: boolean;
    quantity: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Simplified version for card display
export interface ProductCardData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: { amount: number; currency: string };
  media: { thumbnail: string };
  meta: {
    players: string;
    duration: string;
    age: string;
  };
}
