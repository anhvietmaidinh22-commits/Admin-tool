const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ffvauosrkonyurosobqi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_ySmFZ2zFsdz47pmvpHf9Dg_GDrTFlfN';
const ROW_ID = 'main_production_state';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = { ...(req.query || {}), ...(req.body || {}) };

  const subId = String(q.u_id || q.sub_id || q.sub1 || '').trim().toUpperCase();
  const orderCode = String(q.order_code || q.order_id || q.conversion_id || ('ADPIA_' + Date.now())).trim().toUpperCase();
  const orderValue = Number(q.amount || q.order_value || q.sale_amount || 0);
  const grossCommission = Number(q.commission || q.payout || q.pub_commission || 0);
  const rawStatus = String(q.status || 'pending').toLowerCase();

  if (!subId || grossCommission <= 0) {
    return res.status(200).json({ ok: true, ignored: true, reason: 'Missing u_id or zero commission' });
  }

  try {
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/hoantien247_store?id=eq.${ROW_ID}&select=payload`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const rows = await getRes.json();
    if (!Array.isArray(rows) || !rows.length || !rows[0].payload) {
      return res.status(500).json({ error: 'Store not initialized' });
    }

    const state = rows[0].payload;
    const sharePct = Number((state.settings && state.settings.customerSharePct) || 75);
    const customerCashback = Math.round((grossCommission * sharePct) / 100);
    const webProfit = grossCommission - customerCashback;

    const buyer = (state.users || []).find(u => String(u.refCode || '').toUpperCase() === subId);
    if (!buyer) {
      return res.status(200).json({ ok: true, ignored: true, reason: 'User refCode not found: ' + subId });
    }

    let step = 1;
    if (rawStatus.includes('approve') || rawStatus.includes('success') || rawStatus === '1' || rawStatus === 'paid') step = 3;
    else if (rawStatus.includes('reject') || rawStatus.includes('cancel') || rawStatus === '2' || rawStatus === '0') step = 0;

    state.orders = state.orders || [];
    const existing = state.orders.find(o => o.id.toUpperCase() === orderCode);

    if (!existing) {
      state.orders.unshift({
        id: orderCode,
        userId: buyer.id,
        platform: String(q.merchant || '').toLowerCase().includes('tiktok') ? 'TikTok Shop' : 'Shopee',
        productName: `Đơn tự động #${orderCode}`,
        orderValue,
        grossCommission,
        cashbackAmount: customerCashback,
        webProfit,
        step,
        createdAt: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      });
      if (step === 3) {
        buyer.balanceAvailable = (buyer.balanceAvailable || 0) + customerCashback;
      } else if (step !== 0) {
        buyer.balancePending = (buyer.balancePending || 0) + customerCashback;
      }
    } else {
      const prevStep = existing.step;
      const prevCb = Number(existing.cashbackAmount || 0);
      existing.grossCommission = grossCommission;
      existing.cashbackAmount = customerCashback;
      existing.webProfit = webProfit;
      existing.step = step;

      if (step === 3 && prevStep !== 3) {
        if (prevStep !== 0) buyer.balancePending = Math.max(0, (buyer.balancePending || 0) - prevCb);
        buyer.balanceAvailable = (buyer.balanceAvailable || 0) + customerCashback;
      } else if (step === 0 && prevStep !== 0 && prevStep !== 3) {
        buyer.balancePending = Math.max(0, (buyer.balancePending || 0) - prevCb);
      }
    }

    await fetch(`${SUPABASE_URL}/rest/v1/hoantien247_store`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id: ROW_ID, payload: state, updated_at: new Date().toISOString() })
    });

    return res.status(200).json({
      ok: true,
      orderCode,
      subId,
      grossCommission,
      customerCashback,
      webProfit,
      step
    });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
