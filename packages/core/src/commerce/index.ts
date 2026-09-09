/**
 * Normalised fulfilment statuses. Provider-specific statuses are mapped to
 * these by shipping adapters; UIs render timelines from these only.
 * Web renders timelines vertically, mobile horizontally — same data.
 */

export type FulfilmentMode = "COURIER" | "PICKUP" | "HYPERLOCAL";

export const COURIER_FLOW = ["ORDERED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
export const PICKUP_FLOW = ["ORDERED", "PACKED", "READY_FOR_PICKUP", "PICKED_UP"] as const;
export const HYPERLOCAL_FLOW = ["ORDERED", "PACKED", "COURIER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export type CourierStatus = (typeof COURIER_FLOW)[number];
export type PickupStatus = (typeof PICKUP_FLOW)[number];
export type HyperlocalStatus = (typeof HYPERLOCAL_FLOW)[number];
export type FulfilmentStatus = CourierStatus | PickupStatus | HyperlocalStatus;

/** Terminal states outside the happy path. */
export const EXCEPTION_STATUSES = ["CANCELLED", "RETURNED", "REFUNDED", "FAILED_DELIVERY", "PICKUP_EXPIRED"] as const;
export type ExceptionStatus = (typeof EXCEPTION_STATUSES)[number];

export type OrderStatus = FulfilmentStatus | ExceptionStatus;

export function flowFor(mode: FulfilmentMode): readonly FulfilmentStatus[] {
  switch (mode) {
    case "COURIER":
      return COURIER_FLOW;
    case "PICKUP":
      return PICKUP_FLOW;
    case "HYPERLOCAL":
      return HYPERLOCAL_FLOW;
  }
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  ORDERED: "Ordered",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "Picked up",
  COURIER_ASSIGNED: "Courier assigned",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
  FAILED_DELIVERY: "Delivery failed",
  PICKUP_EXPIRED: "Pickup window expired",
};

/** Whether moving from `from` to `to` is a legal forward step in the given mode. */
export function canTransition(mode: FulfilmentMode, from: OrderStatus, to: OrderStatus): boolean {
  if ((EXCEPTION_STATUSES as readonly string[]).includes(to)) {
    return !(EXCEPTION_STATUSES as readonly string[]).includes(from);
  }
  const flow = flowFor(mode) as readonly string[];
  const i = flow.indexOf(from);
  const j = flow.indexOf(to);
  return i >= 0 && j === i + 1;
}
