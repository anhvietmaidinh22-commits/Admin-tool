const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-id, Authorization');
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
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
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

  // 2. Xóa sạch tham số rác & tách ID sản phẩm
  try {
    const parsed = new URL(currentUrl);
    if (parsed.hostname.includes('shopee.vn')) {
      parsed.search = '';
      currentUrl = parsed.toString();

      const prodMatch = parsed.pathname.match(/\/product\/(\d+)\/(\d+)/);
      const iMatch = parsed.pathname.match(/-i\.(\d+)\.(\d+)/);

      if (prodMatch) {
        shopId = prodMatch[1];
        itemId = prodMatch[2];
        currentUrl = `https://shopee.vn/product/${shopId}/${itemId}`;
        title = `Sản phẩm Shopee (Mã #${itemId})`;
      } else if (iMatch) {
        shopId = iMatch[1];
        itemId = iMatch[2];
        const slugMatch = parsed.pathname.match(/^\/(.+?)-i\.\d+\.\d+/);
        if (slugMatch && slugMatch[1]) {
          title = decodeURIComponent(slugMatch[1]).replace(/-/g, ' ');
        } else {
          title = `Sản phẩm Shopee (Mã #${itemId})`;
        }
      }
    } else if (parsed.hostname.includes('tiktok.com')) {
      parsed.search = '';
      currentUrl = parsed.toString();
      title = 'Sản phẩm TikTok Shop';
    }
  } catch (_) {}

  // 3. Gọi chính thức Shopee Affiliate Open API (nếu đã điền AppID & Secret)
  const appId = req.headers['x-app-id'] || process.env.SHOPEE_APP_ID || '';
  const authHeader = req.headers['authorization'] || '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (process.env.SHOPEE_SECRET || '');

  if (appId && secret && itemId) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        query: `query { productOfferV2(itemId: ${itemId}, limit: 1) { nodes { productName imageUrl priceMin offerLink } } }`
      });
      const signature = crypto
        .createHash('sha256')
        .update(`${appId}${timestamp}${payload}${secret}`)
        .digest('hex');

      const gqlRes = await fetch('https://open-api.affiliate.shopee.vn/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`
        },
        body: payload
      });
      const gqlJson = await gqlRes.json();
      const node = gqlJson?.data?.productOfferV2?.nodes?.[0];
      if (node) {
        if (node.productName) title = node.productName;
        if (node.imageUrl) image = node.imageUrl;
        if (node.priceMin) price = Number(node.priceMin);
      }
    } catch (_) {}
  }

  return res.status(200).json({ resolvedUrl: currentUrl, title, image, price, itemId });
};
