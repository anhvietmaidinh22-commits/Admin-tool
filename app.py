import os
import requests
from datetime import datetime
from flask import Flask, request, jsonify

app = Flask(__name__)

# Lấy Token và Chat ID từ biến môi trường trên Render
TOKEN = os.environ.get('TOKEN')
CHAT_ID = os.environ.get('CHAT_ID')

# Biến lưu trữ tổng tiền thu nhập trong ngày (tính từ lúc server chạy)
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

        # Lấy thông tin giao dịch từ SePay
        gateway = data.get('gateway', 'N/A')
        transactionDate = data.get('transactionDate', 'N/A')
        accountNumber = data.get('accountNumber', 'N/A')
        content = data.get('content', 'N/A')
        transferType = data.get('transferType', 'in')
        transferAmount = data.get('transferAmount', 0)
        accumulated = data.get('accumulated', 0)
        
        # Kiểm tra và reset tổng tiền nếu sang ngày mới
        current_date = datetime.now().strftime('%Y-%m-%d')
        if current_date != last_reset_date:
            daily_total_in = 0
            last_reset_date = current_date

        # Định dạng lại số tiền
        try:
            amount_val = float(transferAmount)
        except ValueError:
            amount_val = 0
            
        formatted_amount = f"{int(amount_val):,}" if str(transferAmount).replace('.', '', 1).isdigit() else transferAmount
        formatted_accumulated = f"{int(accumulated):,}" if str(accumulated).replace('.', '', 1).isdigit() else accumulated

        # Chỉ xử lý giao dịch tiền vào (in)
        if transferType == 'in':
            daily_total_in += amount_val
            formatted_daily_total = f"{int(daily_total_in):,}"

            # Thiết kế khung tin nhắn kèm tổng kết thu nhập trong ngày
            message = (
                f"🚨 **VIỆT ANH ƠI TIỀN VỀ NÀY** 🚨\n\n"
                f"🏦 **Ngân hàng:** {gateway}\n"
                f"💰 **Số tiền:** `+{formatted_amount} VNĐ`\n"
                f"📝 **Nội dung:** {content}\n"
                f"👤 **Số tài khoản:** {accountNumber}\n"
                f"📊 **Số dư hiện tại:** `{formatted_accumulated} VNĐ`\n"
                f"📈 **Tổng thu hôm nay:** `{formatted_daily_total} VNĐ`\n"
                f"⏱ **Thời gian:** {transactionDate}"
            )

            # Gửi tin nhắn lên Telegram
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
