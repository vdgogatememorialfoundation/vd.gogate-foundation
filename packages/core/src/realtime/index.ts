/**
 * Socket.IO channel (room) naming and event payload contracts.
 * Server: `io.to(channels.order(id)).emit(events.ORDER_STATUS, payload)`.
 * Clients subscribe with `socket.emit("subscribe", channel)` after auth.
 */

export const channels = {
  checkinEvent: (eventId: string) => `checkin:event:${eventId}` as const,
  order: (orderId: string) => `order:${orderId}` as const,
  application: (applicationId: string) => `application:${applicationId}` as const,
  courier: (shipmentId: string) => `courier:${shipmentId}` as const,
  user: (userId: string) => `user:${userId}` as const,
  adminActivity: "admin:activity" as const,
} as const;

export const events = {
  CHECKIN_SCAN: "checkin.scan",
  CHECKIN_STATS: "checkin.stats",
  ORDER_STATUS: "order.status",
  APPLICATION_STATUS: "application.status",
  COURIER_LOCATION: "courier.location",
  ADMIN_ACTIVITY: "admin.activity",
  NOTIFICATION: "user.notification",
} as const;

export type ChannelName =
  | ReturnType<typeof channels.checkinEvent>
  | ReturnType<typeof channels.order>
  | ReturnType<typeof channels.application>
  | ReturnType<typeof channels.courier>
  | ReturnType<typeof channels.user>
  | typeof channels.adminActivity;

export interface CheckinScanPayload {
  eventId: string;
  eventDay: number;
  ticketId: string;
  applicationId: string;
  applicantName: string;
  result: "CHECKED_IN" | "REJECTED" | "DUPLICATE";
  reason?: string;
  scannedBy: { publicId: string; name: string };
  scannedAt: string; // ISO
}

export interface CheckinStatsPayload {
  eventId: string;
  eventDay: number;
  totalRegistrations: number;
  uniqueTickets: number;
  checkedIn: number;
  rejected: number;
  duplicate: number;
  asOf: string;
}

export interface AdminActivityPayload {
  id: string;
  occurredAt: string;
  actorLabel: string | null;
  module: string;
  action: string;
  summary: string;
  entityType: string | null;
  entityId: string | null;
}

export interface StatusTimelineStep<S extends string = string> {
  status: S;
  label: string;
  at: string | null; // ISO or null if not reached
  note?: string;
}

export interface StatusUpdatePayload<S extends string = string> {
  entityId: string;
  status: S;
  timeline: StatusTimelineStep<S>[];
  updatedAt: string;
}

/** Parse a channel string and validate its shape; used by the socket server for authorization. */
export function parseChannel(name: string): { kind: string; id: string | null } | null {
  if (name === channels.adminActivity) return { kind: "admin", id: null };
  const m = /^(checkin:event|order|application|courier|user):([A-Za-z0-9-]+)$/.exec(name);
  if (!m) return null;
  return { kind: m[1]!, id: m[2]! };
}
