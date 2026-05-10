// `import type` ensures no runtime import is emitted, so this module remains
// a pure type-only side of the store ↔ api ↔ hooks dependency graph and the
// circular `store → api → store-types` runtime cycle is avoided.
import type { store } from './store';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
