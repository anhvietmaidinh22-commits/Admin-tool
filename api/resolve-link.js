export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawUrl = (req.query.url || (req.body && req.body.url) || '').trim();
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Redmi Note 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9'
  };

  try {
    let currentUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    let hops = 0;

    while (hops < 6) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers
      });
      const location = response.headers.get('location');
      if (location && response.status >= 300 && response.status < 400) {
        currentUrl = new URL(location, currentUrl).toString();
        hops++;
      } else {
        break;
      }
    }

    let title = '';
    let image = '';
    let price = 0;

    try {
      const parsed = new URL(currentUrl);
      if (parsed.hostname.includes('shopee.vn')) {
        ['af_siteid', 'pid', 'af_click_lookback', 'af_viewthrough_lookback', 'is_retargeting', 'c', 'af_reengagement_window', 'af_sub_siteid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(p => parsed.searchParams.delete(p));
        currentUrl = parsed.toString();

        // Lấy tên từ slug URL Shopee làm dự phòng
        const slugMatch = parsed.pathname.match(/^\/(.+?)-i\.\d+\.\d+/);
        if (slugMatch && slugMatch[1]) {
          title = decodeURIComponent(slugMatch[1]).replace(/-/g, ' ');
        }
      }
    } catch (_) {}

    // Đọc metadata HTML (Tên SP, Ảnh, Giá)
    try {
      const pageRes = await fetch(currentUrl, { headers });
      const html = await pageRes.text();

      const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<title>([^<]+)<\/title>/i);
      if (ogTitle && ogTitle[1]) {
        title = ogTitle[1]
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/\s*\|\s*Shopee Việt Nam.*/i, '')
          .replace(/\s*-\s*TikTok Shop.*/i, '')
          .trim();
      }

      const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      if (ogImg && ogImg[1]) {
        image = ogImg[1].trim();
      }

      const metaPrice = html.match(/<meta[^>]+property=["'](?:product:price:amount|og:price:amount)["'][^>]+content=["']([\d.]+)["']/i) ||
                        html.match(/"price"\s*:\s*"?(\d{4,10})"?/i) ||
                        html.match(/"min_price"\s*:\s*(\d{4,10})/i);
      if (metaPrice && metaPrice[1]) {
        let p = Number(metaPrice[1]);
        if (p > 1000000000) p = Math.round(p / 100000); // Chuẩn hóa đơn vị *100000 của Shopee nếu có
        price = p;
      }
    } catch (_) {}

    return res.status(200).json({
      resolvedUrl: currentUrl,
      title,
      image,
      price
    });
  } catch (err) {
    return res.status(200).json({ resolvedUrl: rawUrl, title: '', image: '', price: 0 });
  }
}
EOF
