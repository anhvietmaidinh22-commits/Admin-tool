module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawUrl = ((req.query && req.query.url) || (req.body && req.body.url) || '').trim();
  if (!rawUrl) return res.status(400).json({ error: 'Missing url' });

  let currentUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  let title = '';
  let image = '';
  let price = 0;

  // 1. Giải mã link rút gọn
  try {
    let hops = 0;
    while (hops < 6) {
      const r = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'User-Agent': 'facebookexternalhit/1.1' }
      });
      const loc = r.headers.get('location');
      if (loc && r.status >= 300 && r.status < 400) {
        currentUrl = new URL(loc, currentUrl).toString();
        hops++;
      } else {
        break;
      }
    }
  } catch (_) {}

  // Làm sạch tham số tracking cũ & tách tên từ URL Shopee
  try {
    const parsed = new URL(currentUrl);
    if (parsed.hostname.includes('shopee.vn')) {
      ['af_siteid', 'pid', 'af_click_lookback', 'af_viewthrough_lookback', 'is_retargeting', 'c', 'af_reengagement_window', 'af_sub_siteid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'uls_trackid'].forEach(p => parsed.searchParams.delete(p));
      currentUrl = parsed.toString();

      const slugMatch = parsed.pathname.match(/^\/(.+?)-i\.\d+\.\d+/);
      if (slugMatch && slugMatch[1]) {
        title = decodeURIComponent(slugMatch[1]).replace(/-/g, ' ');
      }
    }
  } catch (_) {}

  // 2. Lấy Ảnh + Tên + Giá qua Microlink API
  try {
    const mlRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(currentUrl)}`);
    const mlJson = await mlRes.json();
    const d = mlJson && mlJson.data;
    if (d) {
      if (d.url && d.url.includes('shopee.vn')) currentUrl = d.url;
      if (d.title && !d.title.toLowerCase().includes('shopee việt nam | mua')) {
        title = d.title.replace(/\s*\|\s*Shopee Việt Nam.*/i, '').replace(/\s*-\s*TikTok Shop.*/i, '').trim();
      }
      if (d.image && d.image.url) image = d.image.url;

      const textToScan = `${d.title || ''} ${d.description || ''}`;
      const priceMatch = textToScan.match(/[₫đ]\s*([\d.,]+)/i) || textToScan.match(/([\d.,]+)\s*[₫đ]/i);
      if (priceMatch && priceMatch[1]) {
        price = Number(priceMatch[1].replace(/[.,]/g, ''));
      }
    }
  } catch (_) {}

  return res.status(200).json({ resolvedUrl: currentUrl, title, image, price });
};
