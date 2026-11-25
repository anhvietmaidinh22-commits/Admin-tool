export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawUrl = (req.query.url || (req.body && req.body.url) || '').trim();
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    let currentUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    let hops = 0;

    while (hops < 6) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Redmi Note 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const location = response.headers.get('location');
      if (location && (response.status >= 300 && response.status < 400)) {
        currentUrl = new URL(location, currentUrl).toString();
        hops++;
      } else {
        break;
      }
    }

    // Làm sạch các tham số tracking cũ của người khác nếu có trên link Shopee
    try {
      const parsed = new URL(currentUrl);
      if (parsed.hostname.includes('shopee.vn')) {
        ['af_siteid', 'pid', 'af_click_lookback', 'af_viewthrough_lookback', 'is_retargeting', 'c', 'af_reengagement_window', 'af_sub_siteid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(param => {
          parsed.searchParams.delete(param);
        });
        currentUrl = parsed.toString();
      }
    } catch (_) {}

    return res.status(200).json({ resolvedUrl: currentUrl });
  } catch (err) {
    return res.status(200).json({ resolvedUrl: rawUrl });
  }
}
