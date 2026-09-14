import os
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify

app = Flask(__name__)

TOKEN = "8986371446:AAEo6hNxWqXwQ181L8YXz68t1SVHeYiLo7g"
CHAT_ID = "8348914397"

# Bộ nhớ lưu trữ lịch sử doanh thu theo ngày (Định dạng: {'YYYY-MM-DD': tổng_tiền})
daily_revenue_history = {}

daily_total_in = 0
daily_tx_count = 0
daily_amounts = []
last_reset_date = datetime.now().strftime('%Y-%m-%d')
latest_accumulated = "Chưa cập nhật số dư"
latest_gateway = "N/A"

# Biến tạm lưu trạng thái người dùng (ví dụ: đang chờ nhập số ngày thống kê)
user_states = {} 

def check_and_reset_day():
    global daily_total_in, daily_tx_count, daily_amounts, last_reset_date, daily_revenue_history
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    # Lưu lại doanh thu của ngày cũ trước khi reset
    if daily_total_in > 0:
        daily_revenue_history[last_reset_date] = daily_total_in

    if current_date != last_reset_date:
        daily_total_in = 0
        daily_tx_count = 0
        daily_amounts = []
        last_reset_date = current_date

def send_main_menu(chat_id):
    menu_keyboard = {
        "keyboard": [
            [{"text": "📊 Tổng kết hôm nay"}, {"text": "📈 Thống kê theo số ngày"}],
            [{"text": "💎 Xem số dư hiện tại"}, {"text": "⏰ Cài giờ báo cáo"}]
        ],
        "resize_keyboard": True,
        "is_persistent": True
    }
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": "🤖 *BẢNG ĐIỀU KHIỂN QUẢN LÝ TÀI CHÍNH*\nSếp muốn thao tác gì, chọn nút bên dưới nhé:",
        "parse_mode": "Markdown",
        "reply_markup": menu_keyboard
    }
    requests.post(url, json=payload)

@app.route('/')
def home():
    return "Bot Management System is running!", 200

# Endpoint kích hoạt báo cáo tự động từ Pipedream lúc 21h
@app.route('/trigger-summary', methods=['POST'])
def trigger_summary():
    global daily_total_in, daily_tx_count, daily_amounts, latest_accumulated, latest_gateway
    try:
        check_and_reset_day()
        avg_amount = int(daily_total_in / daily_tx_count) if daily_tx_count > 0 else 0
        max_amount = int(max(daily_amounts)) if daily_amounts else 0
        min_amount = int(min(daily_amounts)) if daily_amounts else 0

        summary_message = (
            f"📊 *TỔNG KẾT HÔM NAY NHÉ SẾP* 💲🏧\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"📅 Ngày: `{datetime.now().strftime('%d/%m/%Y')}`\n"
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

        # 1. Xử lý nút bấm Inline (Check đơn, đổi giờ báo cáo, v.v.)
        if 'callback_query' in data:
            query = data['callback_query']
            callback_data = query['data']
            chat_id = query['message']['chat']['id']
            message_id = query['message']['message_id']

            if callback_data == 'check_done':
                new_text = query['message']['text'] + "\n\n✅ *[ĐÃ ĐƯỢC SẾP CHECK XÁC NHẬN]*"
                url_edit = f"https://api.telegram.org/bot{TOKEN}/editMessageText"
                requests.post(url_edit, json={
                    "chat_id": chat_id,
                    "message_id": message_id,
                    "text": new_text,
                    "parse_mode": "Markdown",
                    "reply_markup": {"inline_keyboard": []}
                })
            elif callback_data == 'set_time_21':
                msg = "✅ *Đã ghi nhận!* Lịch báo cáo tự động hiện đang cố định lúc **21:00 hàng ngày**."
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})

            requests.post(f"https://api.telegram.org/bot{TOKEN}/answerCallbackQuery", json={"callback_query_id": query['id']})
            return jsonify({"status": "success"}), 200

        # 2. Xử lý tin nhắn văn bản & Bấm nút Menu cố định ở dưới
        if 'message' in data and 'text' in data['message']:
            text_received = data['message']['text'].strip()
            chat_id = data['message']['chat']['id']
            check_and_reset_day()

            # Kiểm tra nếu người dùng đang ở trạng thái nhập số ngày để thống kê
            if user_states.get(chat_id) == 'waiting_for_days':
                user_states[chat_id] = None # Reset trạng thái
                try:
                    days = int(text_received)
                    if days <= 0:
                        raise ValueError()
                    
                    # Tính tổng doanh thu trong X ngày gần nhất
                    total_sum = daily_total_in # Gồm cả hôm nay
                    history_text = f"📅 *Doanh thu {days} ngày gần nhất:*\n"
                    
                    today = datetime.now()
                    for i in range(days):
                        d = today - timedelta(days=i)
                        d_str = d.strftime('%Y-%m-%d')
                        d_display = d.strftime('%d/%m/%Y')
                        
                        if i == 0:
                            amt = daily_total_in
                        else:
                            amt = daily_revenue_history.get(d_str, 0)
                        
                        history_text += f"- `{d_display}`: `{int(amt):,}` VNĐ\n"
                        if i > 0:
                            total_sum += amt

                    history_text += f"━━━━━━━━━━━━━━━━━━━\n💰 **Tổng cộng:** `{int(total_sum):,}` VNĐ"
                    requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": history_text, "parse_mode": "Markdown"})
                except ValueError:
                    requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": "⚠️ Số ngày không hợp lệ! Vui lòng bấm nút '📈 Thống kê theo số ngày' lại và nhập một số nguyên dương (VD: 3, 7, 30).", "parse_mode": "Markdown"})
                return jsonify({"status": "success"}), 200

            # Xử lý các nút Menu cố định
            if text_received == "📊 Tổng kết hôm nay":
                avg = int(daily_total_in / daily_tx_count) if daily_tx_count > 0 else 0
                msg = (
                    f"📊 *BÁO CÁO NHANH HÔM NAY*\n"
                    f"💰 Tổng thu: `{int(daily_total_in):,}` VNĐ\n"
                    f"📦 Tổng đơn: `{daily_tx_count}` đơn\n"
                    f"📈 Trung bình: `{avg:,}` VNĐ"
                )
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})
                return jsonify({"status": "success"}), 200

            elif text_received == "📈 Thống kê theo số ngày":
                user_states[chat_id] = 'waiting_for_days' # Bật trạng thái chờ nhập số ngày
                msg = "🔢 Sếp muốn xem doanh thu trong bao nhiêu ngày gần nhất? *(Ví dụ nhập số: 3, 7 hoặc 30)*:"
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})
                return jsonify({"status": "success"}), 200

            elif text_received == "💎 Xem số dư hiện tại":
                msg = f"💎 *Số dư tài khoản mới nhất:*\n`{latest_accumulated}`"
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})
                return jsonify({"status": "success"}), 200

            elif text_received == "⏰ Cài giờ báo cáo":
                # Gửi menu tùy chỉnh giờ báo cáo qua nút bấm
                reply_markup = {
                    "inline_keyboard": [
                        [{"text": "⏰ Cố định lúc 21:00 hàng ngày", "callback_data": "set_time_21"}]
                    ]
                }
                msg = "⚙️ *CÀI ĐẶT THỜI GIAN BÁO CÁO*\nHệ thống mặc định báo cáo doanh thu tự động lúc **21:00 tối** mỗi ngày để sếp tổng kết."
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown", "reply_markup": reply_markup})
                return jsonify({"status": "success"}), 200

            if text_received in ["/start", "Menu", "menu"]:
                send_main_menu(chat_id)
                return jsonify({"status": "success"}), 200

        # 3. Xử lý Webhook tiền vào từ SePay / Ngân hàng
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
                f"⏰ Thời gian: {transactionDate}\n"
                f"━━━━━━━━━━━━━━━━━━━"
            )

            reply_markup = {
                "inline_keyboard": [
                    [
                        {"text": "✅ Check đơn này", "callback_data": "check_done"},
                        {"text": "📊 Thống kê nhanh", "callback_data": "get_stats"}
                    ]
                ]
            }

            url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
            payload = {
                "chat_id": CHAT_ID,
                "text": message,
                "parse_mode": "Markdown",
                "reply_markup": reply_markup
            }
            requests.post(url, json=payload)

        return jsonify({"status": "success"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
