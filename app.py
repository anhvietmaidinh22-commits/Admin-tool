import os
import json
import requests
from datetime import datetime
from flask import Flask, request, jsonify

app = Flask(__name__)

TOKEN = "8986371446:AAEo6hNxWqXwQ181L8YXz68t1SVHeYiLo7g"
CHAT_ID = "8348914397"

# Tên file lưu trữ dữ liệu vĩnh viễn trên server
DATA_FILE = "revenue_data.json"

def load_data():
    """Hàm đọc dữ liệu từ file JSON"""
    today_str = datetime.now().strftime('%Y-%m-%d')
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Nếu sang ngày mới, tự động reset dữ liệu
                if data.get('date') != today_str:
                    return {"date": today_str, "total_in": 0.0, "tx_count": 0, "amounts": [], "latest_accumulated": "Chưa cập nhật", "latest_gateway": "N/A"}
                return data
        except Exception:
            pass
    return {"date": today_str, "total_in": 0.0, "tx_count": 0, "amounts": [], "latest_accumulated": "Chưa cập nhật", "latest_gateway": "N/A"}

def save_data(data):
    """Hàm ghi dữ liệu xuống file JSON"""
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Error saving data: {e}")

@app.route('/')
def home():
    return "Bot Financial Management is running!", 200

# Endpoint để Pipedream gọi vào đúng 21h hàng ngày
@app.route('/trigger-summary', methods=['POST'])
def trigger_summary():
    try:
        data = load_data()
        total_in = data.get("total_in", 0.0)
        tx_count = data.get("tx_count", 0)
        amounts = data.get("amounts", [])
        accumulated = data.get("latest_accumulated", "Chưa cập nhật")
        gateway = data.get("latest_gateway", "N/A")

        avg_amount = int(total_in / tx_count) if tx_count > 0 else 0
        max_amount = int(max(amounts)) if amounts else 0
        min_amount = int(min(amounts)) if amounts else 0
        now_str = datetime.now().strftime('%d/%m/%Y - %H:%M:%S')

        summary_message = (
            f"📊 *TỔNG KẾT HÔM NAY NHÉ SẾP* 💲🏧\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"📅 Ngày báo cáo: `{now_str}`\n"
            f"💰 Tổng tiền thu: `{int(total_in):,}` VNĐ\n"
            f"📦 Tổng số giao dịch: `{tx_count}` đơn\n"
            f"💎 Số dư hiện có: `{accumulated}`\n"
            f"📈 Trung bình/đơn: `{avg_amount:,}` VNĐ\n"
            f"🚀 Đơn khủng nhất: `+{max_amount:,}` VNĐ\n"
            f"☕ Đơn nhỏ nhất: `+{min_amount:,}` VNĐ\n"
            f"🏛️ Ngân hàng chính: `{gateway}`\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"🔥 *Chúc sếp ngủ ngon, mai lại đếm tiền mỏi tay!*"
        )

        url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
        payload = {"chat_id": CHAT_ID, "text": summary_message, "parse_mode": "Markdown"}
        requests.post(url, json=payload)
        return jsonify({"status": "success", "message": "Summary sent!"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Endpoint nhận Webhook chuyển tiền từ SePay
@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        req_data = request.json
        if not req_data:
            return jsonify({"status": "error"}), 400

        gateway = req_data.get('gateway', 'N/A')
        transactionDate = req_data.get('transactionDate', 'N/A')
        accountNumber = req_data.get('accountNumber', 'N/A')
        content = req_data.get('content', 'N/A')
        transferType = req_data.get('transferType', 'in')
        transferAmount = req_data.get('transferAmount', 0)
        
        raw_accumulated = req_data.get('accumulated') or req_data.get('balance') or req_data.get('afterBalance')

        # Tải dữ liệu hiện tại từ file JSON lên
        data = load_data()

        try:
            amount_val = float(transferAmount)
        except ValueError:
            amount_val = 0

        if raw_accumulated is not None:
            try:
                acc_val = float(raw_accumulated)
                data["latest_accumulated"] = f"{int(acc_val):,} VNĐ"
            except (ValueError, TypeError):
                pass

        data["latest_gateway"] = gateway

        # Nếu là tiền vào, tiến hành cộng dồn chính xác
        if transferType == 'in':
            data["total_in"] += amount_val
            data["tx_count"] += 1
            data["amounts"].append(amount_val)
            
            # Lưu lại vào file JSON ngay lập tức
            save_data(data)

            formatted_amount = f"{int(amount_val):,}"
            formatted_daily_total = f"{int(data['total_in']):,}"

            message = (
                f"🚨 *CÓ TIỀN CÓ TIỀN SẾP ƠI 💰💰💵* 🚨\n"
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"🏛️ Ngân hàng: `{gateway}`\n"
                f"💵 Số tiền: `+{formatted_amount}` VNĐ\n"
                f"💬 Nội dung: {content}\n"
                f"💳 Tài khoản: `{accountNumber}`\n"
                f"💎 Số dư: `{data['latest_accumulated']}`\n"
                f"📈 Tổng thu hôm nay: `{formatted_daily_total}` VNĐ\n"
                f"⏰ Thời gian giao dịch: `{transactionDate}`\n"
                f"━━━━━━━━━━━━━━━━━━━"
            )

            url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
            payload = {"chat_id": CHAT_ID, "text": message, "parse_mode": "Markdown"}
            requests.post(url, json=payload)

        return jsonify({"status": "success"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
