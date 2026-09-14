import os
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify

app = Flask(__name__)

TOKEN = "8986371446:AAEo6hNxWqXwQ181L8YXz68t1SVHeYiLo7g"
CHAT_ID = "8348914397"

daily_revenue_history = {}
daily_total_in = 0
daily_tx_count = 0
daily_amounts = []
last_reset_date = datetime.now().strftime('%Y-%m-%d')
latest_accumulated = "Chưa cập nhật số dư"
latest_gateway = "N/A"

user_states = {}

def check_and_reset_day():
    global daily_total_in, daily_tx_count, daily_amounts, last_reset_date, daily_revenue_history
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    if daily_total_in > 0:
        daily_revenue_history[last_reset_date] = daily_total_in

    if current_date != last_reset_date:
        daily_total_in = 0
        daily_tx_count = 0
        daily_amounts = []
        last_reset_date = current_date

# Gửi Menu dạng nút bấm trực tiếp trong tin nhắn
def send_inline_menu(chat_id):
    current_time_str = datetime.now().strftime('%d/%m/%Y lúc %H:%M:%S')
    inline_keyboard = {
        "inline_keyboard": [
            [{"text": "📊 Tổng kết hôm nay", "callback_data": "btn_today"}],
            [{"text": "📈 Thống kê theo số ngày", "callback_data": "btn_stats_days"}],
            [{"text": "💎 Xem số dư hiện tại", "callback_data": "btn_balance"}],
            [{"text": "⏰ Cài đặt giờ báo cáo", "callback_data": "btn_settings"}]
        ]
    }
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": f"🤖 *BẢNG ĐIỀU KHIỂN QUẢN LÝ TÀI CHÍNH*\n🕒 Thời điểm mở menu: `{current_time_str}`\n\nSếp muốn thao tác tính năng nào, hãy bấm vào các nút bên dưới nhé:",
        "parse_mode": "Markdown",
        "reply_markup": inline_keyboard
    }
    requests.post(url, json=payload)

@app.route('/')
def home():
    return "Bot Management System is running!", 200

@app.route('/trigger-summary', methods=['POST'])
def trigger_summary():
    global daily_total_in, daily_tx_count, daily_amounts, latest_accumulated, latest_gateway
    try:
        check_and_reset_day()
        avg_amount = int(daily_total_in / daily_tx_count) if daily_tx_count > 0 else 0
        max_amount = int(max(daily_amounts)) if daily_amounts else 0
        min_amount = int(min(daily_amounts)) if daily_amounts else 0
        now_str = datetime.now().strftime('%d/%m/%Y - %H:%M:%S')

        summary_message = (
            f"📊 *TỔNG KẾT HÔM NAY NHÉ SẾP* 💲🏧\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"📅 Thời điểm báo cáo: `{now_str}`\n"
            f"💰 Tổng tiền thu: `{int(daily_total_in):,}` VNĐ\n"
            f"📦 Số giao dịch: `{daily_tx_count}` đơn\n"
            f"💎 Số dư hiện có: `{latest_accumulated}`\n"
            f"📈 Trung bình/đơn: `{avg_amount:,}` VNĐ\n"
            f"🚀 Đơn khủng nhất: `+{max_amount:,}` VNĐ\n"
            f"☕ Đơn nhỏ nhất: `+{min_amount:,}` VNĐ\n"
            f"🏛️ Ngân hàng chính: `{latest_gateway}`\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"🔥 *Chúc sếp ngủ ngon, mai lại đếm tiền mỏi tay!*"
        )

        url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
        payload = {
            "chat_id": CHAT_ID,
            "text": summary_message,
            "parse_mode": "Markdown"
        }
        requests.post(url, json=payload)
        return jsonify({"status": "success", "message": "Summary sent!"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/webhook', methods=['POST'])
def webhook():
    global daily_total_in, daily_tx_count, daily_amounts, latest_accumulated, latest_gateway, user_states
    try:
        data = request.json
        if not data:
            return jsonify({"status": "error"}), 400

        # 1. Xử lý khi sếp bấm vào các nút Inline trong tin nhắn
        if 'callback_query' in data:
            query = data['callback_query']
            callback_data = query['data']
            chat_id = query['message']['chat']['id']
            check_and_reset_day()
            now_str = datetime.now().strftime('%d/%m/%Y lúc %H:%M:%S')

            if callback_data == 'btn_today':
                avg = int(daily_total_in / daily_tx_count) if daily_tx_count > 0 else 0
                msg = (
                    f"📊 *BÁO CÁO NHANH HÔM NAY*\n"
                    f"🕒 Thời gian: `{now_str}`\n"
                    f"━━━━━━━━━━━━━━━━━━━\n"
                    f"💰 Tổng thu: `{int(daily_total_in):,}` VNĐ\n"
                    f"📦 Tổng đơn: `{daily_tx_count}` đơn\n"
                    f"📈 Trung bình: `{avg:,}` VNĐ"
                )
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})

            elif callback_data == 'btn_stats_days':
                user_states[chat_id] = 'waiting_for_days'
                msg = f"🔢 *THỐNG KÊ DOANH THU THEO KỲ*\n🕒 Thời điểm yêu cầu: `{now_str}`\n\nSếp vui lòng **gõ nhập số ngày** muốn kiểm tra vào khung chat *(Ví dụ: gửi số `3`, `7` hoặc `30`)*:"
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})

            elif callback_data == 'btn_balance':
                msg = f"💎 *SỐ DƯ TÀI KHOẢN MỚI NHẤT*\n🕒 Cập nhật lúc: `{now_str}`\n━━━━━━━━━━━━━━━━━━━\n`{latest_accumulated}`"
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})

            elif callback_data == 'btn_settings':
                msg = (
                    f"⚙️ *CẤU HÌNH THỜI GIAN BÁO CÁO TỰ ĐỘNG*\n"
                    f"🕒 Thời gian kiểm tra: `{now_str}`\n"
                    f"━━━━━━━━━━━━━━━━━━━\n"
                    f"• Lịch trình hiện tại: **21:00 hàng ngày**\n"
                    f"• Trạng thái: 🟢 Hoạt động tự động qua Pipedream."
                )
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})

            requests.post(f"https://api.telegram.org/bot{TOKEN}/answerCallbackQuery", json={"callback_query_id": query['id']})
            return jsonify({"status": "success"}), 200

        # 2. Xử lý tin nhắn văn bản (Nhập số ngày hoặc lệnh /start)
        if 'message' in data and 'text' in data['message']:
            text_received = data['message']['text'].strip()
            chat_id = data['message']['chat']['id']
            check_and_reset_day()
            now_str = datetime.now().strftime('%d/%m/%Y lúc %H:%M:%S')

            if text_received in ["/start", "/menu", "Menu", "menu"]:
                send_inline_menu(chat_id)
                return jsonify({"status": "success"}), 200

            if user_states.get(chat_id) == 'waiting_for_days':
                user_states[chat_id] = None
                try:
                    days = int(text_received)
                    if days <= 0:
                        raise ValueError()
                    
                    total_sum = daily_total_in
                    history_text = f"📅 *BÁO CÁO DOANH THU {days} NGÀY GẦN NHẤT*\n🕒 Tính đến: `{now_str}`\n━━━━━━━━━━━━━━━━━━━\n"
                    
                    today = datetime.now()
                    for i in range(days):
                        d = today - timedelta(days=i)
                        d_str = d.strftime('%Y-%m-%d')
                        d_display = d.strftime('%d/%m/%Y')
                        
                        if i == 0:
                            amt = daily_total_in
                        else:
                            amt = daily_revenue_history.get(d_str, 0)
                        
                        history_text += f"- Ngày `{d_display}`: `{int(amt):,}` VNĐ\n"
                        if i > 0:
                            total_sum += amt

                    history_text += f"━━━━━━━━━━━━━━━━━━━\n💰 **TỔNG CỘNG:** `{int(total_sum):,}` VNĐ"
                    requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": history_text, "parse_mode": "Markdown"})
                except ValueError:
                    requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": "⚠️ Số ngày không hợp lệ! Vui lòng bấm lại nút 'Thống kê theo số ngày' và nhập số nguyên dương (VD: 3, 7, 30).", "parse_mode": "Markdown"})
                return jsonify({"status": "success"}), 200

        # 3. Xử lý khi có tiền chuyển vào từ SePay
        gateway = data.get('gateway', 'N/A')
        transactionDate = data.get('transactionDate', 'N/A')
        accountNumber = data.get('accountNumber', 'N/A')
        content = data.get('content', 'N/A')
        transferType = data.get('transferType', 'in')
        transferAmount = data.get('transferAmount', 0)
        
        raw_accumulated = data.get('accumulated') or data.get('balance') or data.get('afterBalance')

        check_and_reset_day()

        try:
            amount_val = float(transferAmount)
        except ValueError:
            amount_val = 0

        if raw_accumulated is not None:
            try:
                acc_val = float(raw_accumulated)
                latest_accumulated = f"{int(acc_val):,} VNĐ"
            except (ValueError, TypeError):
                pass

        latest_gateway = gateway

        if transferType == 'in':
            daily_total_in += amount_val
            daily_tx_count += 1
            daily_amounts.append(amount_val)
            
            formatted_amount = f"{int(amount_val):,}"
            formatted_daily_total = f"{int(daily_total_in):,}"

            message = (
                f"🚨 *CÓ TIỀN CÓ TIỀN SẾP ƠI 💰💰💵* 🚨\n"
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"🏛️ Ngân hàng: `{gateway}`\n"
                f"💵 Số tiền: `+{formatted_amount}` VNĐ\n"
                f"💬 Nội dung: {content}\n"
                f"💳 Tài khoản: `{accountNumber}`\n"
                f"💎 Số dư: `{latest_accumulated}`\n"
                f"📈 Tổng thu hôm nay: `{formatted_daily_total}` VNĐ\n"
                f"⏰ Thời gian giao dịch: `{transactionDate}`\n"
                f"━━━━━━━━━━━━━━━━━━━"
            )

            url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
            payload = {
                "chat_id": CHAT_ID,
                "text": message,
                "parse_mode": "Markdown"
            }
            requests.post(url, json=payload)

        return jsonify({"status": "success"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
