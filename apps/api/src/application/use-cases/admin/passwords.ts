// Spec §3 + §10.5: a single fixed default password is used for both new
// proctor accounts and any admin/staff-triggered password reset. The
// recipient is forced to change it on next sign-in via `mustChangePassword`.
export const INITIAL_PASSWORD = '123456';
