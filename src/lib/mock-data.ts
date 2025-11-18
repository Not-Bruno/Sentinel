import type { Host } from './types';

// This data is now only used for the initial paint, 
// then it's replaced by the data from the flow.
// We start with an empty array in production.
export const INITIAL_HOSTS: Host[] = [];
