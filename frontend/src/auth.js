import { createAuthClient } from '@neondatabase/neon-js/auth';

// Initialize the Neon Auth client
// The URL should be provided in the Vite environment variables
const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL);

export { authClient };
