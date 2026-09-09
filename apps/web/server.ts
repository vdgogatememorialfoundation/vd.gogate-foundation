/**
 * Custom Node server: Next.js + Socket.IO on one port.
 * Realtime channels are defined in @vgmf/core/realtime. Clients authenticate
 * with the session cookie; subscription to admin channels requires permission.
 */
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { channels, events, onAudit, parseChannel } from "@vgmf/core";
import { resolveSession, can, SESSION_COOKIE } from "@vgmf/auth";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

function cookieValue(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => void handle(req, res));
  const io = new Server(httpServer, { path: "/realtime", cors: { origin: process.env.NEXT_PUBLIC_APP_URL ?? true, credentials: true } });

  io.use(async (socket, nextFn) => {
    const token = cookieValue(socket.handshake.headers.cookie, SESSION_COOKIE) ?? (socket.handshake.auth?.token as string | undefined);
    socket.data.user = await resolveSession(token);
    nextFn();
  });

  io.on("connection", (socket) => {
    socket.on("subscribe", async (channel: string, ack?: (ok: boolean) => void) => {
      const parsed = parseChannel(channel);
      const user = socket.data.user;
      let ok = false;
      if (parsed) {
        switch (parsed.kind) {
          case "admin":
            ok = can(user, "audit:view");
            break;
          case "checkin:event":
            ok = can(user, "checkin:dashboard", { scopeType: "EVENT", scopeId: parsed.id! }) || can(user, "checkin:dashboard");
            break;
          case "user":
            ok = Boolean(user && (user.id === parsed.id || can(user, "users:view")));
            break;
          default:
            // order / application / courier: owner or staff checks are added with those domains (Phase 2/5).
            ok = Boolean(user);
        }
      }
      if (ok) await socket.join(channel);
      ack?.(ok);
    });
    socket.on("unsubscribe", (channel: string) => void socket.leave(channel));
  });

  onAudit((row) => io.to(channels.adminActivity).emit(events.ADMIN_ACTIVITY, row));

  httpServer.listen(port, hostname, () => {
    console.log(`> VGMF platform ready on http://${hostname}:${port} (${dev ? "development" : "production"})`);
  });
});
