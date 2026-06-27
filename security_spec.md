# Security Specification

## 1. Data Invariants
- `UserProfile` (users/{userId}): A user profile document ID MUST match the `uid` field inside the document.
- `IssueReport` (issues/{issueId}): An issue report MUST be created by an authenticated user and `authorId` MUST match `request.auth.uid`.

## 2. The "Dirty Dozen" Payloads (Examples)
1. Write to /users/{otherUserId} as {userId} -> PERMISSION_DENIED
2. Update /users/{userId} with `role: "authority"` without permission -> PERMISSION_DENIED
3. Create /issues/{issueId} with `authorId: "wrongUserId"` -> PERMISSION_DENIED
4. Update /issues/{issueId} status to "resolved" without authority role -> PERMISSION_DENIED
5. Inject massive string into `title` -> PERMISSION_DENIED
6. Create issue without `createdAt` -> PERMISSION_DENIED
7. Update `createdAt` -> PERMISSION_DENIED
8. Delete /issues/{issueId} -> PERMISSION_DENIED (unless authorized)
9. Read /users/{userId} as anonymous -> PERMISSION_DENIED
10. Update issue `id` -> PERMISSION_DENIED
11. Update issue `authorId` -> PERMISSION_DENIED
12. Create issue with missing required fields -> PERMISSION_DENIED
