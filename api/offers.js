const OFFER_MARGIN_RATE = 0.4; // Giữ lại 40% phần chênh lệch an toàn

function calcSafeUserReward(netPayoutVnd, marginRate = OFFER_MARGIN_RATE) {
  const net = Number(netPayoutVnd || 0);
  if (net <= 0) return 0;
  const safeReward = net * (1 - Number(marginRate || 0.4));
  const rounded = Math.floor(safeReward / 1000) * 1000;
  if (rounded < 1000) return 0;
  return Math.min(rounded, 100000);
}

function extractNumber(val) {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (!val) return 0;
  const plainText = String(val).replace(/<[^>]*>/g, ' ');
  const cleaned = plainText.replace(/[^\d.]/g, '');
  const num = Number(cleaned || 0);
  return Number.isFinite(num) ? num : 0;
}

function buildMasofferUrl(pubId, token) {
  const cleanPub = String(pubId || '').trim();
  const cleanToken = String(token || '').trim();
  if (!cleanPub || !cleanToken) return '';
  const encodedToken = cleanToken.includes('%') ? cleanToken : encodeURIComponent(cleanToken);
  return `https://publisher-api.masoffer.net/offer/all?pub_id=${encodeURIComponent(cleanPub)}&token=${encodedToken}`;
}

function parseSourceUrls(req) {
  const rawList = [];

  const directMasoffer = buildMasofferUrl(req.query?.pub_id, req.query?.token);
  if (directMasoffer) rawList.push(directMasoffer);

  if (typeof req.query?.urls === 'string' && req.query.urls.trim()) {
    rawList.push(...req.query.urls.split(/[\n,]+/));
  }
  if (typeof req.query?.url === 'string' && req.query.url.trim()) {
    rawList.push(req.query.url.trim());
  }

  const envMulti = process.env.MASOFFER_API_URLS || process.env.OFFER_API_URLS || '';
  const envSingle = process.env.MASOFFER_API_URL || process.env.SOURCE_OFFER_API_URL || '';
  if (envMulti) rawList.push(...envMulti.split(/[\n,]+/));
  if (envSingle) rawList.push(envSingle);

  const cleaned = rawList
    .map((u) => String(u || '').trim())
    .filter((u) => /^https?:\/\//i.test(u));

  return [...new Set(cleaned)];
}

async function fetchSingleSource(sourceUrl) {
  const upstream = await fetch(sourceUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0'
    },
    cache: 'no-store'
  });

  const rawText = await upstream.text();
  let parsed = {};
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    return {
      sourceUrl,
      ok: false,
      status: upstream.status,
      error: 'Phản hồi không phải JSON',
      preview: rawText.slice(0, 200),
      offers: []
    };
  }

  if (!upstream.ok) {
    return {
      sourceUrl,
      ok: false,
      status: upstream.status,
      error: parsed?.message || parsed?.error || ('Lỗi HTTP ' + upstream.status),
      offers: []
    };
  }

  const rawList = Array.isArray(parsed)
    ? parsed
    : (Array.isArray(parsed.data) ? parsed.data : (parsed.offers || parsed.items || []));

  const sampleRaw = rawList[0]
    ? Object.fromEntries(
        Object.entries(rawList[0]).map(([k, v]) => [
          k,
          typeof v === 'string' ? v.slice(0, 120) : v
        ])
      )
    : null;

  const offers = rawList
    .map((item, idx) => {
      const rawPayout = extractNumber(
        item.payout_vnd ?? item.payout ?? item.commission ?? item.commission_vnd ?? item.commission_rate ?? 0
      );
      const reward = calcSafeUserReward(rawPayout, OFFER_MARGIN_RATE);
      const domainUrl = item.domain
        ? `https://${String(item.domain).replace(/^https?:\/\//, '').trim()}`
        : '';
      const url = String(
        item.tracking_url || item.click_url || item.offer_url || item.url || item.link || domainUrl || ''
      ).trim();

      return {
        id: String(item.offer_id || item.id || `OFFER_${idx + 1}`),
        cat: 'Khảo sát',
        title: String(item.name || item.title || item.offer_name || `Chiến dịch #${idx + 1}`).trim(),
        rawPayout,
        reward,
        url,
        guide: 'Mở link chiến dịch, hoàn thành yêu cầu và nhập mã xác nhận để nhận thưởng.'
      };
    })
    .filter((o) => Boolean(o.url));

  return {
    sourceUrl,
    ok: true,
    status: upstream.status,
    rawCount: rawList.length,
    sampleRaw,
    offers
  };
}

export default async function handler(req, res) {
  try {
    const sources = parseSourceUrls(req);
    if (!sources.length) {
      return res.status(200).json({
        ok: true,
        sourcesCount: 0,
        offers: [],
        message: 'Truyền ?pub_id=...&token=... hoặc ?url=... hoặc ?urls=...'
      });
    }

    const results = await Promise.all(sources.map((s) => fetchSingleSource(s)));

    const seen = new Set();
    const mergedOffers = [];
    for (const r of results) {
      for (const offer of r.offers) {
        const key = `${offer.url}|${offer.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          mergedOffers.push(offer);
        }
      }
    }

    return res.status(200).json({
      ok: true,
      sourcesCount: sources.length,
      totalOffers: mergedOffers.length,
      sources: results.map(({ sourceUrl, ok, status, rawCount, sampleRaw, error, preview }) => ({
        sourceUrl,
        ok,
        status,
        rawCount: rawCount ?? 0,
        sampleRaw: sampleRaw || null,
        error: error || null,
        preview: preview || null
      })),
      offers: mergedOffers
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Lỗi xử lý danh sách API' });
  }
}
