# Deboo.pk Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default-Deny Net**: Any unmatched path is denied read and write.
2. **PII Isolation**: User profiles (`/users/{userId}`), addresses (`/users/{userId}/addresses/{addressId}`), customer orders (`/orders/{orderId}`), and guest orders (`/guestOrders/{orderId}`) contain PII (`email`, `phone`, `completeAddress`) and are strictly readable only by the document owner (`request.auth.uid == userId`) or authorized staff (`isStaff()`). Guest orders are strictly create-only for guests and readable/mutable only by authorized order staff.
3. **RBAC Enforcement**: Staff roles (`Super Admin`, `Admin`, `Store Manager`, `Order Manager`, `Inventory Manager`, `Marketing Manager`, `Customer Support`) are validated against `/admins/{request.auth.uid}` or the bootstrapped Super Admin email (`codenexgen1@gmail.com` with `email_verified == true`). Customers cannot self-assign `role` or modify `/admins`.
4. **Validation Blueprints & Temporal Integrity**: All document creations enforce `keys().hasAll(...)` + `keys().hasOnly(...)`, type/size bounds on all strings and lists, and `createdAt == request.time`. All updates enforce `isValid[Entity](incoming())`, `affectedKeys().hasOnly(...)`, immutable `createdAt`/`userId`, and `updatedAt == request.time`.
5. **Path Variable Hardening**: All single-document target operations validate `isValidId(id)` (`^[a-zA-Z0-9_-]+$`, `<= 128` chars).

## 2. Adversarial "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Self-Privilege Escalation on Signup**: `POST /users/{uid}` with `role: "Super Admin"` by non-admin user -> DENIED (`role == 'Customer'` required).
2. **Shadow Field Injection on Profile**: `PATCH /users/{uid}` adding `isAdmin: true` -> DENIED (`affectedKeys().hasOnly(['fullName', 'phone', 'photoUrl', 'updatedAt'])`).
3. **Unverified Email Spoofing**: Request claiming `email == "codenexgen1@gmail.com"` with `email_verified == false` -> DENIED (`email_verified == true` required).
4. **Cross-User PII Read**: Authenticated user A reading `/users/{uidB}` or `/users/{uidB}/addresses/{addr}` -> DENIED.
5. **Blanket Order Scraping**: Customer calling `list` on `/orders` without `where('userId', '==', uid)` -> DENIED (`resource.data.userId == request.auth.uid || isStaff()`).
6. **Guest Order PII Read**: Unauthenticated or regular customer reading `/guestOrders/{id}` -> DENIED (`isStaff()` required).
7. **Order Price/Status Tampering**: Customer updating `/orders/{id}` changing `totalAmount: 1` or `orderStatus: "Delivered"` -> DENIED (customers cannot mutate order totals/status; only cancel when `Order Placed` via strict `affectedKeys` or staff only).
8. **Fake Verified Purchase Review**: Customer creating `/reviews/{id}` with `verifiedPurchase: true` or `status: "Approved"` -> DENIED (must be `status == 'Pending'`, `verifiedPurchase` cannot be self-granted unless staff, or verified server/staff side).
9. **Resource Poisoning (1MB ID / String)**: Creating a document with a 2KB ID or 50KB description -> DENIED (`isValidId` + `.size()` limits).
10. **Timestamp Spoofing**: Creating an order or product with backdated `createdAt` (`!= request.time`) -> DENIED.
11. **Unauthorized Product / Inventory Mutation**: Customer or `Marketing Manager` trying to delete a product or alter `stockQuantity` -> DENIED (role permission checks).
12. **Audit Log Tampering**: Staff trying to update or delete `/auditLogs/{id}` -> DENIED (audit logs are append-only).
