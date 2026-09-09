import type { SessionUser } from "@vgmf/auth";

declare module "socket.io" {
  interface SocketData {
    user: SessionUser | null;
  }
}
