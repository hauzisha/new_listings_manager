import { Hono } from "hono";
import { z } from "zod";
import { auth } from "../auth";
import { prisma } from "../prisma";

const authExtRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["AGENT", "PROMOTER"]),
  viaCode: z.string().optional(),
});

authExtRouter.post("/register", async (c) => {
  // Parse and validate request body manually (works with both Zod v3 and v4)
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: { message: "Invalid JSON body", code: "VALIDATION_ERROR" } }, 400);
  }

  const parsed = registerSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issues = parsed.error.issues ?? [];
    const firstMessage = issues[0]?.message ?? "Validation failed";
    return c.json({ error: { message: firstMessage, code: "VALIDATION_ERROR" } }, 400);
  }

  const { name, email, phone, password, role, viaCode } = parsed.data;

  // Call Better Auth's sign-up programmatically
  let signUpResponse: Response;
  try {
    signUpResponse = await auth.api.signUpEmail({
      body: { name, email, password },
      asResponse: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign-up failed";
    return c.json({ error: { message, code: "SIGNUP_FAILED" } }, 400);
  }

  if (!signUpResponse.ok) {
    let errorMessage = "Sign-up failed";
    try {
      const errorBody = (await signUpResponse.json()) as { message?: string };
      if (errorBody.message) errorMessage = errorBody.message;
    } catch {
      // ignore parse errors
    }
    const status = signUpResponse.status as 400 | 401 | 403 | 409 | 422 | 500;
    return c.json({ error: { message: errorMessage, code: "SIGNUP_FAILED" } }, status);
  }

  // Parse the newly created user from the sign-up response
  let newUserId: string;
  try {
    const body = (await signUpResponse.json()) as { user?: { id?: string } };
    const userId = body?.user?.id;
    if (!userId) throw new Error("No user id in response");
    newUserId = userId;
  } catch {
    return c.json(
      { error: { message: "Failed to retrieve created user", code: "INTERNAL_ERROR" } },
      500
    );
  }

  // Resolve referrerId from viaCode if provided
  let referrerId: string | undefined;
  if (viaCode) {
    try {
      const trackingLink = await prisma.trackingLink.findUnique({
        where: { refCode: viaCode },
        select: { creatorId: true },
      });
      if (trackingLink) {
        referrerId = trackingLink.creatorId;
      }
      // If not found, silently ignore
    } catch {
      // Silently ignore tracking link lookup errors
    }
  }

  // Update user record with Hauzisha-specific fields
  await prisma.user.update({
    where: { id: newUserId },
    data: {
      phone,
      role,
      isApproved: false,
      ...(referrerId ? { referrerId } : {}),
    },
  });

  return c.json({ data: { message: "Account created. Pending admin approval." } }, 201);
});

// GET /api/auth/get-session — intercept before Better Auth so Bearer token works on refresh
authExtRouter.get("/get-session", async (c) => {
  const user = c.get("user");
  const session = c.get("session");
  if (!user || !session) {
    return c.json(null);
  }
  return c.json({ user, session });
});

// GET /api/auth/user-status — returns role and isApproved for the authenticated user
authExtRouter.get("/user-status", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, role: true, isApproved: true },
  });

  if (!user) {
    return c.json({ error: { message: "User not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({ data: { name: user.name, email: user.email, role: user.role, isApproved: user.isApproved } });
});

export { authExtRouter };
