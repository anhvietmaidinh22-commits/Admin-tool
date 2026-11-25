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
  let shopId = '';
  let itemId = '';

  // 1. Giải mã link rút gọn s.shopee.vn / vn.shp.ee / vt.tiktok.com
  try {
    let hops = 0;
    while (hops < 8) {
      const r = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        }
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

  // 2. Làm sạch URL & tách shopId, itemId chuẩn xác
  try {
    const parsed = new URL(currentUrl);
    if (parsed.hostname.includes('shopee.vn')) {
      // Xóa sạch toàn bộ query rác (__mobile__, credential_token, uls_trackid, af_...)
      parsed.search = '';
      currentUrl = parsed.toString();

      // Dạng 1: /product/123456/28343713450
      const prodMatch = parsed.pathname.match(/\/product\/(\d+)\/(\d+)/);
      // Dạng 2: /ten-san-pham-i.123456.28343713450
      const iMatch = parsed.pathname.match(/-i\.(\d+)\.(\d+)/);

      if (prodMatch) {
        shopId = prodMatch[1];
        itemId = prodMatch[2];
        // Chuyển về URL chuẩn của Shopee để không dính trang mobile
        currentUrl = `https://shopee.vn/product/${shopId}/${itemId}`;
      } else if (iMatch) {
        shopId = iMatch[1];
        itemId = iMatch[2];
      }

      const slugMatch = parsed.pathname.match(/^\/(.+?)-i\.\d+\.\d+/);
      if (slugMatch && slugMatch[1]) {
        title = decodeURIComponent(slugMatch[1]).replace(/-/g, ' ');
      }
    }
  } catch (_) {}

  // 3. Lấy Ảnh + Tên + Giá qua Microlink API trên URL đã làm sạch
  try {
    const mlRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(currentUrl)}`);
    const mlJson = await mlRes.json();
    const d = mlJson && mlJson.data;
    if (d) {
      if (d.url && d.url.includes('shopee.vn')) {
        const cleanMlUrl = new URL(d.url);
        cleanMlUrl.search = '';
        currentUrl = cleanMlUrl.toString();
      }
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

  // 4. Dự phòng gọi trực tiếp API công khai của Shopee nếu có shopId & itemId
  if (shopId && itemId && (!title || !price)) {
    try {
      const spRes = await fetch(`https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': currentUrl
        }
      });
      const spJson = await spRes.json();
      const item = spJson && spJson.data;
      if (item) {
        if (item.name && !title) title = item.name;
        if (item.image && !image) image = `https://down-vn.img.susercontent.com/file/${item.image}`;
        const rawP = item.price_min || item.price;
        if (rawP && !price) {
          price = rawP > 100000000 ? Math.round(rawP / 100000) : rawP;
        }
      }
    } catch (_) {}
  }

  return res.status(200).json({ resolvedUrl: currentUrl, title, image, price });
};
