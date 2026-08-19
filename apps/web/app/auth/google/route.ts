import { proxyAuthGet } from "@/lib/proxyAuth";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return proxyAuthGet(req, "/auth/google");
}
