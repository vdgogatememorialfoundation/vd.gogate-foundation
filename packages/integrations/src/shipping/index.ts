/**
 * Shipping provider interface. Adapters (Shiprocket, iThink Logistics,
 * Porter, Shadowfax, Tookan, Shipday) implement this in Phase 5/8. Live
 * courier location is optional: providers without a location API return
 * `supportsLiveLocation = false` and the UI shows status tracking only.
 */

export interface Address {
  name: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string; // ISO-2
  lat?: number;
  lng?: number;
}

export interface Parcel {
  weightGrams: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  declaredValueMinor: number;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  estimatedDays?: number; // standard courier ETA
  estimatedMinutes?: number; // hyperlocal ETA
  codAvailable?: boolean;
}

export interface RateQuote {
  provider: string;
  courierCode: string;
  courierName: string;
  amountMinor: number;
  estimatedDays?: number;
  estimatedMinutes?: number;
}

export interface CreateShipmentInput {
  publicShipmentId: string;
  orderRef: string;
  pickup: Address;
  delivery: Address;
  parcel: Parcel;
  courierCode?: string;
  cod?: boolean;
  items: { name: string; sku: string; qty: number; unitPriceMinor: number }[];
}

export interface Shipment {
  providerShipmentId: string;
  awb?: string;
  courierName?: string;
  labelUrl?: string;
  trackingUrl?: string;
}

export interface TrackingEvent {
  at: string; // ISO
  providerStatus: string;
  normalizedStatus: string; // FulfilmentStatus
  location?: string;
  note?: string;
}

export interface CourierLocation {
  lat: number;
  lng: number;
  at: string;
  courier?: { name: string; phone?: string };
  etaMinutes?: number;
}

export interface ShippingProvider {
  readonly name: string;
  readonly kind: "COURIER" | "HYPERLOCAL";
  readonly supportsLiveLocation: boolean;
  checkServiceability(from: Pick<Address, "pincode" | "lat" | "lng">, to: Pick<Address, "pincode" | "lat" | "lng">, parcel: Parcel): Promise<ServiceabilityResult>;
  getRates(from: Address, to: Address, parcel: Parcel): Promise<RateQuote[]>;
  createShipment(input: CreateShipmentInput): Promise<Shipment>;
  cancelShipment(providerShipmentId: string): Promise<void>;
  requestPickup(providerShipmentId: string): Promise<void>;
  generateLabel(providerShipmentId: string): Promise<{ labelUrl: string }>;
  trackShipment(providerShipmentId: string): Promise<{ status: string; events: TrackingEvent[] }>;
  getCourierLocation?(providerShipmentId: string): Promise<CourierLocation | null>;
}
