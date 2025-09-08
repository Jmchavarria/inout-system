// /pages/api/docs.json.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { openapiSpec } from '@/lib/openapi';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Clonamos para ajustar dinámicamente el server URL al host real
  const spec = JSON.parse(JSON.stringify(openapiSpec));
  const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
  const host = req.headers.host;
  spec.servers = [{ url: `${proto}://${host}` }];

  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
  res.status(200).json(spec);
}
