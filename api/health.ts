import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, x-account-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasLtaKey = Boolean(process.env.LTA_ACCOUNT_KEY);

  return res.status(200).json({
    status: 'ok',
    service: 'ParkSG Serverless LTA API Proxy',
    timestamp: new Date().toISOString(),
    env: {
      hasLtaKey,
      note: hasLtaKey
        ? 'LTA_ACCOUNT_KEY is configured in server environment.'
        : 'LTA_ACCOUNT_KEY is not yet configured. Please add LTA_ACCOUNT_KEY to your environment variables.',
    },
    endpoints: {
      carparkAvailability: '/api/carparkavailability',
      health: '/api/health',
    },
  });
}
