# Account lifecycle

```
Self-register / admin create
  → User(PENDING_ACTIVATION, publicId=12 digits)
  → OTP emailed (purpose ACTIVATION)
  → /verify → ACTIVE
  → (admin-created) mustChangePassword → /set-password
Forgot password → OTP (PASSWORD_RESET) → new password → all sessions revoked
Admin: reset temp password, resend credentials, disable, ban, reactivate, anonymise (DELETED)
```

Every step writes an `AuditLog` entry; the admin user page shows the per-user timeline.
