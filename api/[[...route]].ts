import { handle } from "hono/vercel";
// @ts-ignore - this file is generated during build
import app from "./_app.mjs";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
