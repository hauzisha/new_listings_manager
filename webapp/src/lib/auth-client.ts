import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BACKEND_URL || undefined,
  fetchOptions: {
    credentials: "include",
  },
});

export const { useSession, signOut, signIn } = authClient;
