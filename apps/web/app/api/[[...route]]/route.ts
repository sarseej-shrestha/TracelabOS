import { handleRequest } from '../../../../../services/api/src/next-runtime.ts';
export const runtime = 'nodejs';
export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
