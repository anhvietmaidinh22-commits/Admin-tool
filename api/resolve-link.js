export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawUrl = String(req.query.url || '').trim();
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let targetUrl = rawUrl;
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'
      }
    });
    clearTimeout(timer);

    const resolvedUrl = response.url || targetUrl;
    const html = await response.text();

    let title = '';
    let image = '';
    let price = 0;

    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
      || html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (ogTitle && ogTitle[1]) {
      title = ogTitle[1]
        .replace(/\s*[|\-]\s*(Shopee Việt Nam|TikTok Shop|TikTok).*$/i, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();
    }

    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImage && ogImage[1]) {
      image = ogImage[1].trim();
    }

    const priceMatch = html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([0-9.]+)["']/i)
      || html.match(/"price"\s*:\s*"?([0-9]{4,10})"?/i)
      || html.match(/₫\s*([0-9]{1,3}(?:[.,][0-9]{3})+)/);
    if (priceMatch && priceMatch[1]) {
      const rawNum = Number(String(priceMatch[1]).replace(/[.,]/g, ''));
      if (rawNum >= 1000 && rawNum <= 500000000) {
        price = rawNum;
      }
    }

    return res.status(200).json({ resolvedUrl, title, image, price });
  } catch (err) {
    return res.status(200).json({ resolvedUrl: targetUrl, title: '', image: '', price: 0 });
  }
}
