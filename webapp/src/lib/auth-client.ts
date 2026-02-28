import { createAuthClient } from "better-auth/react";
import { getSessionToken, setSessionToken } from "./session";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BACKEND_URL || undefined,
  fetchOptions: {
    credentials: "include",
    // Inject session token on every request the auth client makes
    onRequest(ctx) {
      const token = getSessionToken();
      if (token) {
        ctx.request.headers.set("Authorization", `Bearer ${token}`);
      }
    },
    // Capture token from sign-in/sign-up responses
    onSuccess(ctx) {
      if (ctx.data && typeof ctx.data === "object" && "token" in ctx.data) {
        setSessionToken((ctx.data as { token: string }).token);
      }
    },
  },
});

export const { useSession, signOut, signIn } = authClient;
export { setSessionToken };
