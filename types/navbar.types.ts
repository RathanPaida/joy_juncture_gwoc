export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  dropdown?: Omit<NavItem, 'dropdown' | 'icon'>[];
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

export interface UserData {
  points: number;
  cartItems: number;
}

export interface ProfileData {
  totalPoints: number;
  displayName?: string;
  photoURL?: string;
}