import os
import requests
from datetime import datetime
from flask import Flask, request, jsonify

app = Flask(__name__)

TOKEN = "8986371446:AAEo6hNxWqXwQ181L8YXz68t1SVHeYiLo7g"
CHAT_ID = "8348914397"

daily_total_in = 0
daily_tx_count = 0
daily_amounts = []
last_reset_date = datetime.now().strftime('%Y-%m-%d')
latest_accumulated = "Chưa cập nhật số dư"
latest_gateway = "N/A"

def check_and_reset_day():
    global daily_total_in, daily_tx_count, daily_amounts, last_reset_date
    current_date = datetime.now().strftime('%Y-%m-%d')
    if current_date != last_reset_date:
        daily_total_in = 0
        daily_tx_count = 0
        daily_amounts = []
        last_reset_date = current_date

def send_main_menu(chat_id):
    menu_keyboard = {
        "keyboard": [
            [{"text": "📊 Tổng kết doanh thu hôm nay"}, {"text": "💎 Xem số dư hiện tại"}],
            [{"text": "⚙️ Trạng thái hệ thống"}]
        ],
        "resize_keyboard": True,
        "is_persistent": True
    }
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": "🤖 **CHÀO SẾP ĐÃ TRỞ LẠI!**\nSếp muốn kiểm tra thông tin gì, cứ bấm vào các nút bên dưới nhé:",
        "parse_mode": "Markdown",
        "reply_markup": menu_keyboard
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

        summary_message = (
            f"📊 **TỔNG KẾT HÔM NAY NHÉ SẾP 💲🏧** 📊\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"📅 **Ngày:** `{datetime.now().strftime('%d/%m/%Y')}`\n"
            f"💰 **Tổng tiền thu:** `{int(daily_total_in):,} VNĐ`\n"
            f"📦 **Số giao dịch:** `{daily_tx_count}` đơn\n"
            f"💎 **Số dư hiện có:** `{latest_accumulated}`\n"
            f"📈 **Trung bình/đơn:** `{avg_amount:,} VNĐ`\n"
            f"🚀 **Đơn khủng nhất:** `+{max_amount:,} VNĐ`\n"
            f"☕ **Đơn nhỏ nhất:** `+{min_amount:,} VNĐ`\n"
            f"🏛️ **Ngân hàng chính:** `{latest_gateway}`\n"
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
    global daily_total_in, daily_tx_count, daily_amounts, latest_accumulated, latest_gateway
    try:
        data = request.json
        if not data:
            return jsonify({"status": "error"}), 400

        # Xử lý khi bấm nút menu cố định
        if 'message' in data and 'text' in data['message']:
            text_received = data['message']['text']
            chat_id = data['message']['chat']['id']
            check_and_reset_day()

            if text_received == "📊 Tổng kết doanh thu hôm nay":
                avg = int(daily_total_in / daily_tx_count) if daily_tx_count > 0 else 0
                msg = (
                    f"📊 **BÁO CÁO NHANH HÔM NAY**\n"
                    f"💰 Tổng thu: `{int(daily_total_in):,} VNĐ`\n"
                    f"📦 Tổng đơn: `{daily_tx_count}` đơn\n"
                    f"📈 Trung bình: `{avg:,} VNĐ`"
                )
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})
                return jsonify({"status": "success"}), 200

            elif text_received == "💎 Xem số dư hiện tại":
                msg = f"💎 **Số dư tài khoản mới nhất:**\n`{latest_accumulated}`"
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})
                return jsonify({"status": "success"}), 200

            elif text_received == "⚙️ Trạng thái hệ thống":
                msg = f"🟢 **Hệ thống hoạt động bình thường!**\n🏛️ Ngân hàng gần nhất: `{latest_gateway}`"
                requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})
                return jsonify({"status": "success"}), 200

            if text_received in ["/start", "Menu", "menu"]:
                send_main_menu(chat_id)
                return jsonify({"status": "success"}), 200

        # Xử lý Webhook từ SePay / Ngân hàng
        gateway = data.get('gateway', 'N/A')
        transactionDate = data.get('transactionDate', 'N/A')
        accountNumber = data.get('accountNumber', 'N/A')
        content = data.get('content', 'N/A')
        transferType = data.get('transferType', 'in')
        transferAmount = data.get('transferAmount', 0)
        
        # 💡 SỬA Ở ĐÂY: Quét linh hoạt nhiều tên trường số dư khác nhau từ SePay trả về
        raw_accumulated = data.get('accumulated') or data.get('balance') or data.get('afterBalance')

        check_and_reset_day()

        try:
            amount_val = float(transferAmount)
        except ValueError:
            amount_val = 0

        # Kiểm tra và định dạng số dư nếu có dữ liệu gửi về
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
                f"🚨 **CÓ TIỀN CÓ TIỀN SẾP ƠI 💰💰💵** 🚨\n"
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"🏛️ **Ngân hàng:** `{gateway}`\n"
                f"💵 **Số tiền:** `+{formatted_amount} VNĐ`\n"
                f"💬 **Nội dung:** {content}\n"
                f"💳 **Tài khoản:** `{accountNumber}`\n"
                f"💎 **Số dư:** `{latest_accumulated}`\n"
                f"📈 **Tổng thu hôm nay:** `{formatted_daily_total} VNĐ`\n"
                f"⏰ **Thời gian:** {transactionDate}\n"
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
