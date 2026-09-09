# Realtime (Socket.IO)

Contracts live in `packages/core/src/realtime` and are imported by web, admin and the Expo apps.

| Room                        | Events                              | Consumers                         |
| --------------------------- | ----------------------------------- | --------------------------------- |
| `checkin:event:{eventId}`   | `checkin.scan`, `checkin.stats`     | Volunteer app, admin check-in dashboard |
| `order:{orderId}`           | `order.status`                      | Customer web/app order tracking   |
| `application:{applicationId}` | `application.status`              | Applicant portal                  |
| `courier:{shipmentId}`      | `courier.location`                  | Hyperlocal live map (only when provider supports it) |
| `user:{userId}`             | `user.notification`                 | Any signed-in client              |
| `admin:activity`            | `admin.activity`                    | Admin dashboards                  |

Flow: client action → API validates → DB transaction (+ audit row) → emit to room(s). Clients never emit
domain events themselves; they only `subscribe` after authentication.
