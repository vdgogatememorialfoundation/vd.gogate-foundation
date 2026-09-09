# Order statuses

Source: `packages/core/src/commerce`.

| Mode       | Flow |
| ---------- | ---- |
| COURIER    | ORDERED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED |
| PICKUP     | ORDERED → PACKED → READY_FOR_PICKUP → PICKED_UP |
| HYPERLOCAL | ORDERED → PACKED → COURIER_ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED |

Exception statuses (any mode): `CANCELLED`, `RETURNED`, `REFUNDED`, `FAILED_DELIVERY`, `PICKUP_EXPIRED`.

`canTransition(mode, from, to)` enforces forward-only movement plus exceptions. Provider-specific statuses
(Shiprocket, iThink, Porter, …) are mapped into these in their adapters.

Web renders the flow vertically; mobile renders it horizontally — the data model is the same.
Live courier location is shown only when `ShippingProvider.getCourierLocation` is implemented by the provider;
it is never simulated.
