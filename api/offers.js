const OFFER_MARGIN_RATE = 0.4; // Giữ lại 40% phần chênh lệch an toàn để không bị lỗ

function calcSafeUserReward(netPayoutVnd, marginRate = OFFER_MARGIN_RATE) {
  const net = Number(netPayoutVnd || 0);
  if (net <= 0) return 0;
  const safeReward = net * (1 - Number(marginRate || 0.4));
  const rounded = Math.floor(safeReward / 1000) * 1000;
  if (rounded < 1000) return 0;
  return Math.min(rounded, 100000);
}

export default async function handler(req, res) {
  try {
    const customUrl = typeof req.query?.url === 'string' ? req.query.url.trim() : '';
    const sourceUrl = customUrl || process.env.MASOFFER_API_URL || process.env.SOURCE_OFFER_API_URL || '';
    if (!sourceUrl) {
      return res.status(200).json({ ok: true, offers: [], message: 'Chưa cấu hình MASOFFER_API_URL' });
    }

    const upstream = await fetch(sourceUrl, {
      method: 'GET',
      headers: { Accept: 'application/json, text/plain, */*' },
      cache: 'no-store'
    });

    const rawText = await upstream.text();
    let parsed = {};
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return res.status(200).json({
        ok: false,
        error: 'Phản hồi từ API không phải JSON',
        preview: rawText.slice(0, 180)
      });
    }

    const rawList = Array.isArray(parsed)
      ? parsed
      : (Array.isArray(parsed.data) ? parsed.data : (parsed.offers || parsed.items || []));

    const offers = rawList
      .map((item, idx) => {
        const rawPayout = Number(
          item.payout_vnd ?? item.payout ?? item.commission ?? item.commission_rate ?? 0
        );
        const reward = calcSafeUserReward(rawPayout, OFFER_MARGIN_RATE);
        const url = String(item.tracking_url || item.click_url || item.offer_url || item.url || item.link || '').trim();
        if (reward <= 0 || !url) return null;

        return {
          id: String(item.id || item.offer_id || `MAS_${idx + 1}`),
          cat: 'Khảo sát',
          title: String(item.name || item.title || item.offer_name || `Chiến dịch #${idx + 1}`).trim(),
          reward,
          url,
          guide: String(item.commission_rule || item.guide || 'Mở link chiến dịch, hoàn thành yêu cầu và nhập mã xác nhận để nhận thưởng.').trim()
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      ok: true,
      upstreamStatus: upstream.status,
      rawCount: rawList.length,
      offers
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Lỗi kết nối API nguồn' });
  }
}
