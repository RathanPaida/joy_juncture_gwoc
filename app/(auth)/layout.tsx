// app/(auth)/layout.tsx
import type { Metadata } from "next";
import "./auth-global.css";

export const metadata: Metadata = {
  title: "Joy Juncture - Authentication",
  description: "Login or register to Joy Juncture",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
