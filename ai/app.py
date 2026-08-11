import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from model import InventoryAIEngine

app = Flask(__name__)
CORS(app)

ai_engine = InventoryAIEngine()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK", "service": "AI Demand Forecasting & Optimization Service"}), 200

@app.route('/api/ai/forecast', methods=['POST'])
def predict_forecast():
    """
    Body:
    {
      "product_id": 1,
      "sales_history": [
         {"date": "2026-06-01", "quantity_sold": 5},
         ...
      ],
      "forecast_days": 30
    }
    """
    data = request.get_json() or {}
    sales_history = data.get('sales_history', [])
    forecast_days = int(data.get('forecast_days', 30))

    df = pd.DataFrame(sales_history)
    result = ai_engine.train_and_predict_product_demand(df, forecast_days=forecast_days)
    return jsonify({
        "success": True,
        "product_id": data.get('product_id'),
        "forecast": result
    })

@app.route('/api/ai/reorder', methods=['POST'])
def reorder_recommendation():
    """
    Body:
    {
      "current_stock": 8,
      "predicted_30d_demand": 40,
      "lead_time_days": 7,
      "reorder_level": 12
    }
    """
    data = request.get_json() or {}
    current_stock = int(data.get('current_stock', 0))
    predicted_30d_demand = int(data.get('predicted_30d_demand', 30))
    lead_time_days = int(data.get('lead_time_days', 7))
    reorder_level = int(data.get('reorder_level', 10))

    reorder_info = ai_engine.calculate_smart_reorder(
        current_stock, predicted_30d_demand, lead_time_days, reorder_level
    )
    return jsonify({"success": True, "recommendation": reorder_info})

@app.route('/api/ai/batch-analysis', methods=['POST'])
def batch_analysis():
    """
    Analyzes multiple products for demand and reorder
    Body:
    {
      "products": [
        {"id": 1, "name": "Milk", "quantity": 45, "reorder_level": 15, "sales_history": [...]},
        ...
      ]
    }
    """
    data = request.get_json() or {}
    products = data.get('products', [])
    results = []

    for prod in products:
        sales = prod.get('sales_history', [])
        df = pd.DataFrame(sales)
        forecast_res = ai_engine.train_and_predict_product_demand(df, forecast_days=30)
        reorder_res = ai_engine.calculate_smart_reorder(
            current_stock=prod.get('quantity', 0),
            predicted_30d_demand=forecast_res['predicted_total_demand'],
            lead_time_days=7,
            reorder_level=prod.get('reorder_level', 10)
        )
        results.append({
            "product_id": prod.get('id'),
            "product_name": prod.get('name'),
            "category": prod.get('category_name', 'General'),
            "current_stock": prod.get('quantity', 0),
            "reorder_level": prod.get('reorder_level', 10),
            "forecast_30d": forecast_res['predicted_total_demand'],
            "confidence_score": forecast_res['confidence_score'],
            "trend": forecast_res['trend'],
            "reorder_recommendation": reorder_res
        })

    return jsonify({"success": True, "analysis": results})

@app.route('/api/ai/anomalies', methods=['POST'])
def detect_anomalies():
    data = request.get_json() or {}
    logs = data.get('inventory_logs', [])
    anomalies = ai_engine.detect_inventory_anomalies(logs)
    return jsonify({"success": True, "anomalies": anomalies})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
