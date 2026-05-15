import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "USER" | "ADMIN";
      plan: "FREE" | "PRO";
    };
  }
  interface User {
    role: "USER" | "ADMIN";
    plan: "FREE" | "PRO";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN";
    plan: "FREE" | "PRO";
  }
}
