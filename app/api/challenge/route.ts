import { env } from 'cloudflare:workers';
import { handleChallenge } from '../../../lib/server/handlers';
export const dynamic='force-dynamic';
export async function GET(request:Request){return handleChallenge(request,env);}
