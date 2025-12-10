'use server';
// Flows will be imported for their side effects in this file.
import './genkit-registry';
import { initDB } from '@/lib/db';

initDB();
