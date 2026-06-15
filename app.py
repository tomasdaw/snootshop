import json
import os
from pathlib import Path

import stripe
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, send_from_directory

load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
STORE_URL = os.getenv("STORE_URL", "http://localhost:5000")

PRODUCTS_PATH = Path(__file__).parent / "products.json"


def load_products():
    with open(PRODUCTS_PATH) as f:
        return json.load(f)


def get_store_url():
    configured = os.getenv("STORE_URL", "").strip().rstrip("/")
    if configured.startswith(("http://", "https://")):
        return configured
    proto = request.headers.get("X-Forwarded-Proto", request.scheme)
    host = request.headers.get("X-Forwarded-Host", request.host)
    return f"{proto}://{host}".rstrip("/")


def get_product(product_id):
    return next((p for p in load_products() if p["id"] == product_id), None)


@app.route("/")
def index():
    return render_template(
        "index.html",
        products=load_products(),
        stripe_key=PUBLISHABLE_KEY,
    )


@app.route("/product/<product_id>")
def product_page(product_id):
    product = get_product(product_id)
    if not product:
        return "Product not found", 404
    return render_template(
        "product.html",
        product=product,
        products=load_products(),
        stripe_key=PUBLISHABLE_KEY,
    )


@app.route("/success")
def success():
    session_id = request.args.get("session_id", "")
    return render_template(
        "success.html",
        session_id=session_id,
        products=load_products(),
        stripe_key=PUBLISHABLE_KEY,
    )


@app.route("/cancel")
def cancel():
    return render_template(
        "cancel.html",
        products=load_products(),
        stripe_key=PUBLISHABLE_KEY,
    )


@app.route("/api/products")
def api_products():
    return jsonify(load_products())


@app.route("/api/create-checkout-session", methods=["POST"])
def create_checkout_session():
    if not stripe.api_key:
        return jsonify({"error": "Stripe is not configured. Add keys to .env file."}), 500

    data = request.get_json()
    items = data.get("items", [])

    if not items:
        return jsonify({"error": "Cart is empty"}), 400

    store_url = get_store_url()
    line_items = []
    for item in items:
        product = get_product(item["id"])
        if not product:
            return jsonify({"error": f"Product not found: {item['id']}"}), 400
        quantity = max(1, int(item.get("quantity", 1)))
        line_items.append(
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": product["name"],
                        "description": product["tagline"],
                        "images": [f"{store_url}{product['image']}"],
                    },
                    "unit_amount": product["price"],
                },
                "quantity": quantity,
            }
        )

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{store_url}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{store_url}/cancel",
            shipping_address_collection={"allowed_countries": ["US", "CA", "GB", "AU"]},
            phone_number_collection={"enabled": True},
        )
        return jsonify({"url": session.url})
    except stripe.error.StripeError as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5050))
    app.run(debug=True, host="127.0.0.1", port=port)
