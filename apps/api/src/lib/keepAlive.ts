const MIN_MS = 30_000;
const MAX_MS = 60_000;

function nextDelay() {
  return MIN_MS + Math.floor(Math.random() * (MAX_MS - MIN_MS + 1));
}

function healthUrl() {
  const explicit = process.env.HEALTH_PING_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "").replace(/\/health$/i, "") + "/health";
  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) return render.replace(/\/$/, "") + "/health";
  return "";
}

async function ping(url: string) {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    headers: { "user-agent": "tijarah-keepalive" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** Hits /health every 30–60s via the public URL so Render inbound traffic resets idle spin-down. */
export function startKeepAlive() {
  if (process.env.KEEP_ALIVE === "false") return;
  if (process.env.NODE_ENV !== "production" && process.env.KEEP_ALIVE !== "true") return;

  const url = healthUrl();
  if (!url) {
    console.warn("Keep-alive skipped: set HEALTH_PING_URL or RENDER_EXTERNAL_URL");
    return;
  }

  const loop = () => {
    void ping(url)
      .catch((err) => console.warn("Keep-alive failed:", err instanceof Error ? err.message : err))
      .finally(() => setTimeout(loop, nextDelay()));
  };

  console.log(`Keep-alive worker → ${url} every 30–60s`);
  setTimeout(loop, nextDelay());
}
