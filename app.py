from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Thay Token và Chat ID của bạn vào đây
TOKEN = "8986371446:AAEo6hNxWqXwQ181L8YXz68t1SVHeYiLo7g"
CHAT_ID = "8348914397"

def send_telegram(message):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID, 
        "text": message, 
        "parse_mode": "Markdown"
    }
    requests.post(url, json=payload)

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    
    # Lấy thông tin từ SePay gửi sang
    gateway = data.get('gateway', 'Ngân hàng')
    amount = float(data.get('transferAmount', 0))
    content = data.get('content', '')
    acc = data.get('accountNumber', '')
    transaction_date = data.get('transactionDate', '')
    balance = float(data.get('afterBalance', 0))
    
    # Định dạng nội dung thông báo theo đúng ý bạn
    message = (
        f"🚨 *VIỆT ANH ƠI TIỀN VỀ NÀY!* 🚨\n\n"
        f"💰 *SỐ TIỀN:* `+{amount:,.0f} đ`\n"
        f"⏰ *NGÀY GIỜ:* {transaction_date}\n"
        f"📝 *NỘI DUNG:* _{content}_\n"
        f"💎 *SỐ DƯ:* {balance:,.0f} đ\n\n"
        f"──────────────────\n"
        f"🏦 *Ngân hàng:* {gateway} | 💳 `{acc}`"
    )
    
    send_telegram(message)
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
