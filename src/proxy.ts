import type { NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/updateSession";

/** Runs before every page: keeps the signed-in user's session current. */
export const proxy = (request: NextRequest): Promise<NextResponse> =>
  updateSession(request);

export const config = {
  // Every path except Next.js's static files and images, and files with an extension
  // (favicon.ico, robots.txt), which never need a session.
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-z0-9]+$).*)"]
};
