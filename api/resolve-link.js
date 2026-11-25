export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawUrl = (req.query.url || (req.body && req.body.url) || '').trim();
  if (!rawUrl) return res.status(400).json({ error: 'Missing url' });

  // Giả lập User-Agent của Zalo / Facebook Link Preview để Shopee trả về đầy đủ thẻ og:title, og:image, og:description (chứa giá)
  const previewHeaders = {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9'
  };

  try {
    let currentUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    let hops = 0;

    while (hops < 8) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: previewHeaders
      });

      const location = response.headers.get('location');
      if (location && response.status >= 300 && response.status < 400) {
        currentUrl = new URL(location, currentUrl).toString();
        hops++;
      } else {
        const htmlSnippet = await response.text();
        // Bắt thêm trường hợp Shopee redirect bằng meta refresh hoặc JS window.location
        const metaRedir = htmlSnippet.match(/url=(https?:\/\/[^"'\s>]+)/i) ||
                          htmlSnippet.match(/window\.location(?:\.href)?\s*=\s*["'](https?:\/\/[^"']+)["']/i);
        if (metaRedir && metaRedir[1] && metaRedir[1] !== currentUrl && !metaRedir[1].includes('login')) {
          currentUrl = metaRedir[1].replace(/&amp;/g, '&');
          hops++;
          continue;
        }
        break;
      }
    }

    let title = '';
    let image = '';
    let price = 0;
    let shopId = '';
    let itemId = '';

    try {
      const parsed = new URL(currentUrl);
      if (parsed.hostname.includes('shopee.vn')) {
        ['af_siteid', 'pid', 'af_click_lookback', 'af_viewthrough_lookback', 'is_retargeting', 'c', 'af_reengagement_window', 'af_sub_siteid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'uls_trackid'].forEach(p => parsed.searchParams.delete(p));
        currentUrl = parsed.toString();

        // Tách shopid và itemid từ URL (dạng -i.shopid.itemid hoặc /product/shopid/itemid)
        const idMatch = parsed.pathname.match(/-i\.(\d+)\.(\d+)/) ||
                        parsed.pathname.match(/\/product\/(\d+)\/(\d+)/);
        if (idMatch) {
          shopId = idMatch[1];
          itemId = idMatch[2];
        }

        const slugMatch = parsed.pathname.match(/^\/(.+?)-i\.\d+\.\d+/);
        if (slugMatch && slugMatch[1]) {
          title = decodeURIComponent(slugMatch[1]).replace(/-/g, ' ');
        }
      }
    } catch (_) {}

    // Bước 1: Đọc OpenGraph HTML qua bot preview (không bị Shopee chặn captcha)
    try {
      const pageRes = await fetch(currentUrl, { headers: previewHeaders });
      const html = await pageRes.text();

      const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<title>([^<]+)<\/title>/i);
      if (ogTitle && ogTitle[1]) {
        const cleanT = ogTitle[1]
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s*\|\s*Shopee Việt Nam.*/i, '')
          .replace(/\s*-\s*TikTok Shop.*/i, '')
          .trim();
        if (cleanT && !cleanT.toLowerCase().includes('shopee việt nam | mua và bán')) {
          title = cleanT;
        }
      }

      const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      if (ogImg && ogImg[1]) {
        image = ogImg[1].trim();
      }

      // Tìm giá trong meta tags hoặc og:description (Shopee hay ghi "Mua ... giá chỉ ₫159.000")
      const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
      const descText = ogDesc ? ogDesc[1] : '';
      const priceFromDesc = descText.match(/[₫đ]\s*([\d.,]+)/i) || descText.match(/([\d.,]+)\s*[₫đ]/i);
      const metaPrice = html.match(/<meta[^>]+property=["'](?:product:price:amount|og:price:amount)["'][^>]+content=["']([\d.]+)["']/i) ||
                        html.match(/"price"\s*:\s*"?(\d{4,12})"?/i) ||
                        html.match(/"min_price"\s*:\s*(\d{4,12})/i);

      if (metaPrice && metaPrice[1]) {
        let p = Number(metaPrice[1]);
        if (p > 1000000000) p = Math.round(p / 100000);
        price = p;
      } else if (priceFromDesc && priceFromDesc[1]) {
        price = Number(priceFromDesc[1].replace(/[.,]/g, ''));
      }
    } catch (_) {}

    // Bước 2: Nếu có shopId & itemId mà chưa lấy được giá, gọi thêm API item_get của Shopee
    if (shopId && itemId && (!price || !title)) {
      try {
        const apiRes = await fetch(`https://shopee.vn/api/v4/pdp/get_pc?shop_id=${shopId}&item_id=${itemId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': currentUrl
          }
        });
        const json = await apiRes.json();
        const item = json?.data?.item;
        if (item) {
          if (item.title && !title) title = item.title;
          if (item.image && !image) image = `https://down-vn.img.susercontent.com/file/${item.image}`;
          const rawP = item.price_min || item.price;
          if (rawP && !price) {
            price = rawP > 100000000 ? Math.round(rawP / 100000) : rawP;
          }
        }
      } catch (_) {}
    }

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
