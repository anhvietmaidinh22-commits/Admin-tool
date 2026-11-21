const OFFER_MARGIN_RATE = 0.4; // Giữ lại 40% phần chênh lệch an toàn
const DEFAULT_FALLBACK_REWARD = 1000; // Mức thưởng tối thiểu khi nguồn chỉ có % hoa hồng

function calcSafeUserReward(rawValue, marginRate = OFFER_MARGIN_RATE) {
  const str = String(rawValue ?? '').trim();
  const hasPercent = str.includes('%');
  const plainText = str.replace(/<[^>]*>/g, ' ');
  const num = Number(plainText.replace(/[^\d.]/g, '') || 0);

  if (!Number.isFinite(num) || num <= 0) {
    return 0;
  }

  // Nếu là % hoa hồng (vd: 5% hoặc 12.5%), quy đổi an toàn sau khi trừ 40% chênh lệch
  if (hasPercent || (num > 0 && num <= 100 && !/vnd|đ|₫/i.test(str))) {
    const scaled = num * 1000 * (1 - Number(marginRate || 0.4));
    const roundedPct = Math.floor(scaled / 1000) * 1000;
    return Math.max(DEFAULT_FALLBACK_REWARD, Math.min(roundedPct, 100000));
  }

  const safeReward = num * (1 - Number(marginRate || 0.4));
  const rounded = Math.floor(safeReward / 1000) * 1000;
  if (rounded < 1000) {
    return DEFAULT_FALLBACK_REWARD;
  }
  return Math.min(rounded, 100000);
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

  const offers = rawList
    .map((item, idx) => {
      const rawCommission =
        item.payout_vnd ??
        item.payout ??
        item.commission ??
        item.commission_vnd ??
        item.commission_rate ??
        DEFAULT_FALLBACK_REWARD;

      const reward = calcSafeUserReward(rawCommission, OFFER_MARGIN_RATE);
      const domainClean = item.domain
        ? String(item.domain).replace(/^https?:\/\//, '').trim()
        : '';
      const domainUrl = domainClean ? `https://${domainClean}` : '';
      const url = String(
        item.tracking_url ||
        item.click_url ||
        item.offer_url ||
        item.url ||
        item.link ||
        domainUrl ||
        `https://ecom.masoffer.com/offer/${item.offer_id || item.id || idx + 1}`
      ).trim();

      const title = String(
        item.name || item.title || item.offer_name || `Chiến dịch #${idx + 1}`
      ).trim();

      if (!title || !url) return null;

      return {
        id: String(item.offer_id || item.id || `MAS_${idx + 1}`),
        cat: 'Khảo sát',
        title,
        reward,
        url,
        guide: 'Mở link chiến dịch, hoàn thành yêu cầu và nhập mã xác nhận để nhận thưởng.'
      };
    })
    .filter(Boolean);

  return {
    sourceUrl,
    ok: true,
    status: upstream.status,
    rawCount: rawList.length,
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
      sources: results.map(({ sourceUrl, ok, status, rawCount, error }) => ({
        sourceUrl,
        ok,
        status,
        rawCount: rawCount ?? 0,
        error: error || null
      })),
      offers: mergedOffers
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Lỗi xử lý danh sách API' });
  }
}
