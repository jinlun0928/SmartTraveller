from flask import Flask, request, jsonify, send_from_directory
import requests
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.')

# TDX API 設定
TDX_API_URL = "https://tdx.transportdata.tw/api/basic/v2"
TDX_APP_ID = "sssun-09d597db-5ec8-446e"
TDX_APP_KEY = "8ffe4bd6-dc2e-40e1-8f9e-2c5d62e13ab1"

# 城市與 API 端點對應
CITY_API_ENDPOINTS = {
    "台北市": "/Tourism/ScenicSpot/Taipei",
    "新北市": "/Tourism/ScenicSpot/NewTaipei",
    "桃園市": "/Tourism/ScenicSpot/Taoyuan",
    "台中市": "/Tourism/ScenicSpot/Taichung",
    "台南市": "/Tourism/ScenicSpot/Tainan",
    "高雄市": "/Tourism/ScenicSpot/Kaohsiung",
    "基隆市": "/Tourism/ScenicSpot/Keelung",
    "新竹市": "/Tourism/ScenicSpot/Hsinchu",
    "嘉義市": "/Tourism/ScenicSpot/Chiayi",
    "宜蘭縣": "/Tourism/ScenicSpot/YilanCounty",
    "花蓮縣": "/Tourism/ScenicSpot/HualienCounty",
    "台東縣": "/Tourism/ScenicSpot/TaitungCounty",
    "澎湖縣": "/Tourism/ScenicSpot/PenghuCounty",
    "金門縣": "/Tourism/ScenicSpot/KinmenCounty",
    "連江縣": "/Tourism/ScenicSpot/LienchiangCounty"
}

# 城市與美食 API 端點對應
CITY_FOOD_ENDPOINTS = {
    "台北市": "/Tourism/Restaurant/Taipei",
    "新北市": "/Tourism/Restaurant/NewTaipei",
    "桃園市": "/Tourism/Restaurant/Taoyuan",
    "台中市": "/Tourism/Restaurant/Taichung",
    "台南市": "/Tourism/Restaurant/Tainan",
    "高雄市": "/Tourism/Restaurant/Kaohsiung",
    "基隆市": "/Tourism/Restaurant/Keelung",
    "新竹市": "/Tourism/Restaurant/Hsinchu",
    "嘉義市": "/Tourism/Restaurant/Chiayi",
    "宜蘭縣": "/Tourism/Restaurant/YilanCounty",
    "花蓮縣": "/Tourism/Restaurant/HualienCounty",
    "台東縣": "/Tourism/Restaurant/TaitungCounty",
    "澎湖縣": "/Tourism/Restaurant/PenghuCounty",
    "金門縣": "/Tourism/Restaurant/KinmenCounty",
    "連江縣": "/Tourism/Restaurant/LienchiangCounty"
}

def get_tdx_token():
    """獲取 TDX API 的存取令牌"""
    url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "client_credentials",
        "client_id": TDX_APP_ID,
        "client_secret": TDX_APP_KEY
    }
    
    try:
        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()  # 檢查回應狀態
        token_data = response.json()
        return token_data.get("access_token")
    except requests.exceptions.RequestException as e:
        raise

@app.route('/api/spots', methods=['GET'])
def get_spots():
    """處理景點搜尋請求"""
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "請提供城市名稱"}), 400

    try:
        # 獲取 token
        token = get_tdx_token()
        if not token:
            return jsonify({"error": "無法獲取 API 認證"}), 500
        
        # 構建 API 請求
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        
        # 獲取城市特定的 API 端點
        endpoint = CITY_API_ENDPOINTS.get(city)
        if not endpoint:
            return jsonify({"error": "不支援的城市"}), 400
        
        params = {
            "$select": "ScenicSpotID,ScenicSpotName,Address,Phone,Description,OpenTime,Class1,Class2,Class3,Picture,UpdateTime",
            "$top": "100"
        }
        
        # 發送請求到 TDX API
        api_url = f"{TDX_API_URL}{endpoint}"
        response = requests.get(api_url, headers=headers, params=params)
        
        if response.status_code != 200:
            return jsonify({"error": "無法獲取景點資料"}), 500
            
        spots = response.json()
        return jsonify(spots)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/foods', methods=['GET'])
def get_foods():
    """處理美食搜尋請求"""
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "請提供城市名稱"}), 400

    try:
        # 獲取 token
        token = get_tdx_token()
        if not token:
            return jsonify({"error": "無法獲取 API 認證"}), 500
        
        # 構建 API 請求
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        
        # 獲取城市特定的美食 API 端點
        endpoint = CITY_FOOD_ENDPOINTS.get(city)
        if not endpoint:
            return jsonify({"error": "不支援的城市"}), 400
        
        params = {
            "$select": "RestaurantID,RestaurantName,Address,Phone,Description,OpenTime,Picture,UpdateTime",
            "$top": "100"
        }
        
        # 如果是台北市，添加地址過濾
        if city == "台北市":
            params["$filter"] = "contains(Address, '台北市')"
        
        # 發送請求到 TDX API
        api_url = f"{TDX_API_URL}{endpoint}"
        response = requests.get(api_url, headers=headers, params=params)
        
        if response.status_code != 200:
            return jsonify({"error": f"無法獲取美食資料，狀態碼: {response.status_code}"}), 500
            
        foods = response.json()
        return jsonify(foods)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 設定 CORS 標頭
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# 首頁路由
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# 靜態檔案路由
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

