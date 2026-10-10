import { env } from 'cloudflare:workers';
import { handleStatus } from '../../../lib/server/handlers';
export const dynamic='force-dynamic';
export async function GET(){return handleStatus(env);}
