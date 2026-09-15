/**
 * Start the backend the storefront widget talks to.
 *
 *   npm run serve
 *
 * Needs SHOPIFY_API_SECRET (to verify Shopify's signatures), the Supabase
 * credentials, and a model key. In development, `shopify app dev` tunnels a
 * public URL to this port.
 */

import { loadEnv } from "../src/env.js";
import { startServer } from "../src/server/index.js";

loadEnv();

startServer();
