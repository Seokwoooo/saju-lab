import { env } from 'cloudflare:workers';
import { handleOwnerDevice } from '@/lib/server/owner-device';
export const dynamic='force-dynamic';
export async function GET(request:Request){return handleOwnerDevice(request,env);}
export async function POST(request:Request){return handleOwnerDevice(request,env);}
export async function DELETE(request:Request){return handleOwnerDevice(request,env);}
