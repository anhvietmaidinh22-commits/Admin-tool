import os
import requests
from datetime import datetime
from flask import Flask, request, jsonify

app = Flask(__name__)

# Đã điền sẵn Token và Chat ID của bạn
TOKEN = "8986371446:AAEo6hNxWqXwQ181L8YXz68t1SVHeYiLo7g"
CHAT_ID = "8348914397"

daily_total_in = 0
last_reset_date = datetime.now().strftime('%Y-%m-%d')

@app.route('/')
def home():
    return "Server is running!", 200

@app.route('/webhook', methods=['POST'])
def webhook():
    global daily_total_in, last_reset_date
    try:
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "No JSON data"}), 400

        gateway = data.get('gateway', 'N/A')
        transactionDate = data.get('transactionDate', 'N/A')
        accountNumber = data.get('accountNumber', 'N/A')
        content = data.get('content', 'N/A')
        transferType = data.get('transferType', 'in')
        transferAmount = data.get('transferAmount', 0)
        accumulated = data.get('accumulated', 0)
        
        current_date = datetime.now().strftime('%Y-%m-%d')
        if current_date != last_reset_date:
            daily_total_in = 0
            last_reset_date = current_date

        try:
            amount_val = float(transferAmount)
        except ValueError:
            amount_val = 0
            
        formatted_amount = f"{int(amount_val):,}"

        try:
            acc_val = float(accumulated)
            formatted_accumulated = f"{int(acc_val):,} VNĐ"
        except (ValueError, TypeError):
            formatted_accumulated = "Không có dữ liệu"

        if transferType == 'in':
            daily_total_in += amount_val
            formatted_daily_total = f"{int(daily_total_in):,}"

            message = (
                f"🚨 **CÓ TIỀN CÓ TIỀN SẾP ƠI 💰💰💵** 🚨\n"
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"🏛️ **Ngân hàng:** `{gateway}`\n"
                f"💵 **Số tiền:** `+{formatted_amount} VNĐ`\n"
                f"💬 **Nội dung:** {content}\n"
                f"💳 **Tài khoản:** `{accountNumber}`\n"
                f"💎 **Số dư:** `{formatted_accumulated}`\n"
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
