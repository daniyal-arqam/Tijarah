import { NextRequest, NextResponse } from "next/server";

/** Proxy OAuth redirects to the API without following 302s, so cookies stay on the app origin. */
export async function proxyAuthGet(req: NextRequest, apiPath: string) {
  const api = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");
  const dest = `${api}${apiPath}${new URL(req.url).search}`;
  const res = await fetch(dest, {
    method: "GET",
    headers: {
      cookie: req.headers.get("cookie") ?? "",
      accept: req.headers.get("accept") ?? "*/*",
    },
    redirect: "manual",
    cache: "no-store",
  });

  const headers = new Headers();
  const location = res.headers.get("location");
  if (location) headers.set("Location", location);
  for (const cookie of res.headers.getSetCookie()) headers.append("Set-Cookie", cookie);

  if (location) return new NextResponse(null, { status: res.status, headers });
  const body = await res.arrayBuffer();
  return new NextResponse(body, { status: res.status, headers });
}
