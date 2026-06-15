# Snoot Shop — Your Pet Store

Your personal online store for selling pet accessories. Customers browse, add to cart, and pay through Stripe — you fulfill orders and keep the profit.

## Quick start

### 1. Install dependencies

```bash
cd snoot-shop
pip3 install -r requirements.txt
```

### 2. Set up Stripe

1. Create a free account at [stripe.com](https://stripe.com)
2. Go to [Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
3. Copy your **test** keys
4. Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and paste your keys:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STORE_URL=http://127.0.0.1:5050
```

### 3. Run the store

```bash
python3 app.py
```

Open [http://127.0.0.1:5050](http://127.0.0.1:5050)

> **Note:** macOS uses port 5000 for AirPlay. If you see a blank page at `localhost:5000`, use port **5050** instead.

### 4. Test a purchase

Use Stripe's test card: `4242 4242 4242 4242` with any future expiry and any CVC.

## When you get an order

1. Stripe emails you a payment notification
2. Find the product on your supplier and order it shipped to the customer
3. Keep the difference between your sale price and supplier cost

| Supplier | Shipping | Notes |
|----------|----------|-------|
| [CJ Dropshipping](https://cjdropshipping.com) | 7–12 days US | Good for most products |
| [Zendrop](https://zendrop.com) | 5–10 days US | Faster shipping |
| [AliExpress](https://aliexpress.com) | 15–30 days | Cheapest, slowest |

Your cost per product is in `products.json` under `supplierCost` (for your reference only — not shown to customers).

## Promote your store

1. Create @snootshop on TikTok and Instagram
2. Film short videos with your pet using the products
3. Put your store link in your bio
4. Run ads once you have a few videos getting traction

## Going live

1. Switch Stripe to **live** keys in `.env`
2. Set `STORE_URL` to your real domain
3. Deploy to [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io)
4. Point your domain to the deployment
5. Add your domain in Stripe Dashboard → Settings → Domains

## Customize

- **Products**: Edit `products.json` — prices are in cents (2499 = $24.99)
- **Branding**: Update colors in `static/css/style.css` (`:root` variables)
- **Store copy**: Edit files in `templates/`
