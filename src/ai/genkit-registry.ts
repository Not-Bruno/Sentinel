/**
 * @fileoverview This file is the central registry for all Genkit flows.
 * It's imported by `use-hosts.tsx` to ensure that Next.js is aware of all
 * server actions during the build process. This prevents "Failed to find
 * Server Action" errors in production.
 */

import './flows/get-host-containers-flow';
import './flows/manage-hosts-flow';
