import type { Request, Response } from 'express';

const LTA_DATAMALL_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export interface LtaCarparkRecord {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "lat lng" (space-separated WGS84)
  AvailableLots: number;
  LotType: 'C' | 'Y' | 'H';
  Agency: 'HDB' | 'URA' | 'LTA';
}

export interface LtaApiResponse {
  'odata.metadata'?: string;
  value: LtaCarparkRecord[];
}

export default async function handler(req: Request, res: Response) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, x-account-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Retrieve AccountKey from environment or dynamic client header
  const accountKey =
    process.env.LTA_ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    (req.headers['x-account-key'] as string) ||
    (req.query.accountKey as string);

  if (!accountKey || accountKey === 'YOUR_LTA_DATAMALL_KEY_HERE') {
    return res.status(401).json({
      error: 'Missing LTA DataMall AccountKey',
      message:
        'Please set the LTA_ACCOUNT_KEY environment variable in your .env or server environment, or provide the AccountKey header.',
      endpoint: LTA_DATAMALL_ENDPOINT,
      requiresHeader: 'AccountKey: <LTA_ACCOUNT_KEY>',
      value: [],
    });
  }

  try {
    const skip = Number(req.query.skip) || 0;
    const fetchAll = req.query.fetchAll === 'true';

    // Helper to fetch a single batch of 500 records from LTA DataMall
    const fetchBatch = async (skipCount: number): Promise<LtaCarparkRecord[]> => {
      const url = `${LTA_DATAMALL_ENDPOINT}?$skip=${skipCount}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          AccountKey: accountKey,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `LTA DataMall API responded with status ${response.status}: ${errorText || response.statusText}`
        );
      }

      const json = (await response.json()) as LtaApiResponse;
      return json.value || [];
    };

    if (fetchAll) {
      // Paginate through LTA batches (each batch returns up to 500 items)
      let allCarparks: LtaCarparkRecord[] = [];
      let currentSkip = 0;
      const maxPages = 10; // safety ceiling (up to 5,000 carparks)

      for (let page = 0; page < maxPages; page++) {
        const batch = await fetchBatch(currentSkip);
        if (!batch || batch.length === 0) break;
        allCarparks = allCarparks.concat(batch);
        if (batch.length < 500) break; // last page reached
        currentSkip += 500;
      }

      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
      return res.status(200).json({
        total: allCarparks.length,
        timestamp: new Date().toISOString(),
        source: 'LTA DataMall CarParkAvailabilityv2',
        value: allCarparks,
      });
    }

    // Default single page fetch
    const records = await fetchBatch(skip);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

    return res.status(200).json({
      skip,
      count: records.length,
      timestamp: new Date().toISOString(),
      source: 'LTA DataMall CarParkAvailabilityv2',
      value: records,
    });
  } catch (error: any) {
    console.error('Error in LTA Carpark Availability serverless proxy:', error);
    return res.status(502).json({
      error: 'Upstream LTA DataMall Error',
      message: error?.message || 'Failed to fetch from LTA DataMall API',
      timestamp: new Date().toISOString(),
    });
  }
}
