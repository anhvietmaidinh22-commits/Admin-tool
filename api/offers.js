const DEFAULT_MARGIN_RATE = 0.4; // Giữ lại 40% phần chênh lệch an toàn
const MIN_VALID_REWARD = 1000; // Mức thưởng tối thiểu sau khi giữ 40% chênh lệch
const MAX_VALID_REWARD = 100000;

function parseMarginRate(req) {
  const raw = req.query?.margin ?? req.query?.margin_rate;
  if (raw === undefined || raw === null || raw === '') return DEFAULT_MARGIN_RATE;
  const num = Number(String(raw).replace('%', '').trim());
  if (!Number.isFinite(num) || num < 0) return DEFAULT_MARGIN_RATE;
  return num > 1 ? Math.min(num / 100, 0.95) : Math.min(num, 0.95);
}

function calcSafeReward(rawValue, marginRate = DEFAULT_MARGIN_RATE) {
  const str = String(rawValue ?? '').trim();
  const hasPercent = str.includes('%');
  const plain = str.replace(/<[^>]*>/g, ' ');
  const num = Number(plain.replace(/[^\d.]/g, '') || 0);

  if (!Number.isFinite(num) || num <= 0) {
    return MIN_VALID_REWARD;
  }

  let baseAmount = num;
  if (hasPercent || (num > 0 && num <= 100 && !/vnd|đ|₫|usd|\$/i.test(str))) {
    baseAmount = num * 1000;
  }

  const afterMargin = baseAmount * (1 - Number(marginRate ?? DEFAULT_MARGIN_RATE));
  const rounded = Math.floor(afterMargin / 1000) * 1000;

  if (!Number.isFinite(rounded) || rounded < MIN_VALID_REWARD) {
    return MIN_VALID_REWARD;
  }
  return Math.min(rounded, MAX_VALID_REWARD);
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

function extractRawArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.data)) return parsed.data;
  if (Array.isArray(parsed?.offers)) return parsed.offers;
  if (Array.isArray(parsed?.items)) return parsed.items;
  if (Array.isArray(parsed?.result)) return parsed.result;
  return [];
}

function normalizeOffer(item, idx, sourceIndex, marginRate) {
  if (!item || typeof item !== 'object') return null;

  const rawCommission =
    item.payout_vnd ??
    item.payout ??
    item.commission_vnd ??
    item.commission ??
    item.commission_rate ??
    item.reward ??
    MIN_VALID_REWARD;

  const reward = calcSafeReward(rawCommission, marginRate);

  const domainClean = item.domain
    ? String(item.domain).replace(/^https?:\/\//i, '').trim()
    : '';
  const domainUrl = domainClean ? `https://${domainClean}` : '';

  const rawId = String(item.offer_id || item.id || item.campaign_id || '').trim();
  const id = rawId ? `SRC${sourceIndex + 1}_${rawId}` : `SRC${sourceIndex + 1}_${idx + 1}`;

  const url = String(
    item.tracking_url ||
      item.click_url ||
      item.offer_url ||
      item.url ||
      item.link ||
      domainUrl ||
      `https://ecom.masoffer.com/offer/${rawId || idx + 1}`
  ).trim();

  const title = String(
    item.name || item.title || item.offer_name || item.campaign_name || `Chiến dịch #${idx + 1}`
  ).trim();

  if (!title || !url) return null;

  return {
    id,
    cat: 'Khảo sát',
    title,
    reward,
    url,
    guide: 'Mở link chiến dịch, hoàn thành yêu cầu và nhập mã xác nhận để nhận thưởng.'
  };
}

async function fetchSingleSource(sourceUrl, sourceIndex, marginRate) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const upstream = await fetch(sourceUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0'
      },
      cache: 'no-store',
      signal: controller.signal
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
        rawCount: 0,
        error: 'Phản hồi từ nguồn không phải JSON hợp lệ',
        offers: []
      };
    }

    if (!upstream.ok) {
      return {
        sourceUrl,
        ok: false,
        status: upstream.status,
        rawCount: 0,
        error: parsed?.message || parsed?.error || `Lỗi HTTP ${upstream.status}`,
        offers: []
      };
    }

    const rawList = extractRawArray(parsed);
    const offers = rawList
      .map((item, idx) => normalizeOffer(item, idx, sourceIndex, marginRate))
      .filter(Boolean);

    return {
      sourceUrl,
      ok: true,
      status: upstream.status,
      rawCount: rawList.length,
      error: null,
      offers
    };
  } catch (err) {
    return {
      sourceUrl,
      ok: false,
      status: 500,
      rawCount: 0,
      error: err?.name === 'AbortError' ? 'Nguồn API phản hồi quá lâu (timeout)' : (err?.message || 'Lỗi kết nối nguồn'),
      offers: []
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const marginRate = parseMarginRate(req);
    const sources = parseSourceUrls(req);

    if (!sources.length) {
      return res.status(200).json({
        ok: true,
        sourcesCount: 0,
        totalOffers: 0,
        marginRate,
        sources: [],
        offers: [],
        message: 'Truyền ?urls=link1,link2 hoặc ?url=link1 hoặc ?pub_id=...&token=...'
      });
    }

    const results = await Promise.all(
      sources.map((src, idx) => fetchSingleSource(src, idx, marginRate))
    );

    const seenKeys = new Set();
    const mergedOffers = [];

    for (const r of results) {
      for (const offer of r.offers) {
        const dedupeKey = `${offer.url.toLowerCase()}|${offer.title.toLowerCase()}`;
        if (!seenKeys.has(dedupeKey)) {
          seenKeys.add(dedupeKey);
          mergedOffers.push(offer);
        }
      }
    }

    return res.status(200).json({
      ok: true,
      sourcesCount: sources.length,
      totalOffers: mergedOffers.length,
      marginRate,
      sources: results.map(({ sourceUrl, ok, status, rawCount, error }) => ({
        sourceUrl,
        ok,
        status,
        rawCount,
        error
      })),
      offers: mergedOffers
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Lỗi xử lý danh sách API'
    });
  }
}
