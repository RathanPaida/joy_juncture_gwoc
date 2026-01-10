import { getFirebaseToken } from './firebase-auth';
import type { CardGame, GamePackage, Booking, User } from '@/types/experiences';

// Base API client
async function apiFetch<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const token = await getFirebaseToken();
  
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }
  
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetch(endpoint, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }
  
  return data;
}

// Games API client
export const gamesApi = {
  // CardGames
  getCardGames: () => 
    apiFetch<{ success: boolean; data: CardGame[] }>('/api/games'),
  
  getCardGame: (id: string) => 
    apiFetch<{ success: boolean; data: CardGame }>(`/api/games/${id}`),
  
  createCardGame: (game: Omit<CardGame, 'id' | 'createdAt' | 'updatedAt'>) => 
    apiFetch<{ success: boolean; data: CardGame; message: string }>('/api/games', {
      method: 'POST',
      body: JSON.stringify(game),
    }),
  
  updateCardGame: (id: string, game: Partial<CardGame>) => 
    apiFetch<{ success: boolean; data: CardGame; message: string }>('/api/games', {
      method: 'PUT',
      body: JSON.stringify({ id, ...game }),
    }),
  
  deleteCardGame: (id: string) => 
    apiFetch<{ success: boolean; message: string; data: { id: string; name: string } }>(`/api/games?id=${id}`, {
      method: 'DELETE',
    }),
  
  // GamePackages (if you have separate route)
  getGamePackages: () => 
    apiFetch<{ success: boolean; data: GamePackage[] }>('/api/packages'),
  
  // Bookings (if you have separate route)
  getBookings: () => 
    apiFetch<{ success: boolean; data: Booking[] }>('/api/bookings'),
};

// Example React Hook
export function useGamesApi() {
  const getGames = async () => {
    const response = await gamesApi.getCardGames();
    return response.data;
  };
  
  const createGame = async (gameData: Omit<CardGame, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await gamesApi.createCardGame(gameData);
    return response.data;
  };
  
  const updateGame = async (id: string, gameData: Partial<CardGame>) => {
    const response = await gamesApi.updateCardGame(id, gameData);
    return response.data;
  };
  
  const deleteGame = async (id: string) => {
    const response = await gamesApi.deleteCardGame(id);
    return response;
  };
  
  return { getGames, createGame, updateGame, deleteGame };
}