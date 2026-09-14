import os
import requests
from datetime import datetime
from flask import Flask, request, jsonify

app = Flask(__name__)

# Token và Chat ID của sếp
TOKEN = "8986371446:AAEo6hNxWqXwQ181L8YXz68t1SVHeYiLo7g"
CHAT_ID = "8348914397"

# Biến lưu trữ trạng thái doanh thu trong ngày
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

@app.route('/')
def home():
    return "Bot Financial Management is running!", 200

# Endpoint để Pipedream gọi vào đúng 21h hàng ngày để lấy bảng tổng kết
@app.route('/trigger-summary', methods=['POST'])
def trigger_summary():
    global daily_total_in, daily_tx_count, daily_amounts, latest_accumulated, latest_gateway
    try:
        check_and_reset_day()
        
        # Tính toán các chỉ số phụ
        avg_amount = int(daily_total_in / daily_tx_count) if daily_tx_count > 0 else 0
        max_amount = int(max(daily_amounts)) if daily_amounts else 0
        min_amount = int(min(daily_amounts)) if daily_amounts else 0
        now_str = datetime.now().strftime('%d/%m/%Y - %H:%M:%S')

        summary_message = (
            f"📊 *TỔNG KẾT HÔM NAY NHÉ SẾP* 💲🏧\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"📅 Ngày báo cáo: `{now_str}`\n"
            f"💰 Tổng tiền thu: `{int(daily_total_in):,}` VNĐ\n"
            f"📦 Tổng số giao dịch: `{daily_tx_count}` đơn\n"
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

# Endpoint nhận Webhook chuyển tiền từ SePay (ACB)
@app.route('/webhook', methods=['POST'])
def webhook():
    global daily_total_in, daily_tx_count, daily_amounts, latest_accumulated, latest_gateway
    try:
        data = request.json
        if not data:
            return jsonify({"status": "error"}), 400

        gateway = data.get('gateway', 'N/A')
        transactionDate = data.get('transactionDate', 'N/A')
        accountNumber = data.get('accountNumber', 'N/A')
        content = data.get('content', 'N/A')
        transferType = data.get('transferType', 'in')
        transferAmount = data.get('transferAmount', 0)
        
        # Lấy linh hoạt tên biến số dư từ SePay
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

        # Nếu là giao dịch tiền vào (in)
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
