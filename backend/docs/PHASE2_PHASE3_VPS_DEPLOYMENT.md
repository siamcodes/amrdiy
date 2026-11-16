# AMRDIY2 Phase 2–3: MongoDB, Stripe Webhook and Nginx Deployment

## Current implementation

- Order creation uses `services/create-order.js`.
- Replica Set / Sharded topology: stock reservation and Order insert run in one MongoDB transaction.
- Standalone topology: conditional stock updates with compensating rollback are used. This is not a true multi-document transaction.
- Order line items retain price/title/image snapshots.
- Migration checks for duplicate carts and Stripe transaction IDs before creating unique indexes.
- Stripe webhook endpoint: `POST /api/stripe/webhook`. It verifies Stripe signatures and reconciles events against an existing Order.

## 1. Back up MongoDB

Run on the VPS and store the archive somewhere protected:

```bash
cd /path/to/amrdiy2/backend
set -a
. ./.env
set +a
sudo mkdir -p /var/backups
mongodump --uri="$MONGO_URI" --archive=/var/backups/amrdiy2-before-rs.archive --gzip
```

Do not proceed until the backup exists and is readable. Keep it off the MongoDB data volume.

## 2. Convert standalone MongoDB to a single-node Replica Set

A single-node Replica Set enables transactions, but does **not** provide high availability or automatic failover.

1. Check MongoDB configuration and service:

```bash
sudo systemctl status mongod
sudo grep -n -A5 -B3 "replication" /etc/mongod.conf
```

2. Edit `/etc/mongod.conf` and add (or merge) this top-level section. Do not create a duplicate `replication:` key:

```yaml
replication:
  replSetName: rs0
```

3. Restart:

```bash
sudo systemctl restart mongod
sudo systemctl status mongod --no-pager
```

4. Connect using an account with replica-set administration permission:

```bash
mongosh "$MONGO_URI"
```

Initialize once:

```javascript
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "127.0.0.1:27017" }]
})
```

Use the host/port the Node.js backend can actually reach. If Node runs in Docker or another server, do **not** use 127.0.0.1 as the member address; use a stable private DNS/IP reachable from every MongoDB client. Do not expose MongoDB publicly.

5. Wait for PRIMARY:

```javascript
rs.status()
db.hello()
```

The node must report PRIMARY / `isWritablePrimary: true`.

6. Update backend `.env` Mongo URI to include `replicaSet=rs0` and the correct auth database, for example:

```text
mongodb://APP_USER:URL_ENCODED_PASSWORD@127.0.0.1:27017/amrdiy2?authSource=admin&replicaSet=rs0
```

Preserve existing TLS, authentication, and connection options. URL-encode special characters in passwords. Never commit the real URI.

## 3. Run unique-index migration

After resolving any duplicate carts or payment transaction IDs reported by the migration:

```bash
cd /path/to/amrdiy2/backend
npm run migrate:payment-index
```

This creates:
- `uniq_cart_ordered_by`: one active cart per user
- `uniq_payment_transaction_id`: one order per Stripe PaymentIntent

If duplicates are reported, inspect and reconcile those records before retrying. Do not delete production orders blindly.

## 4. Configure Stripe Webhook

In Stripe Dashboard, create endpoint:

```text
https://YOUR_DOMAIN/api/stripe/webhook
```

Subscribe to:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`

Copy the endpoint signing secret (`whsec_...`) into backend `.env`:

```text
STRIPE_WEBHOOK_SECRET=whsec_your_endpoint_secret
```

Keep `STRIPE_SECRET` and `STRIPE_WEBHOOK_SECRET` server-side only.

The webhook acknowledges a successful payment only after its local Order exists. If Stripe delivers the success event before the browser creates the Order, the endpoint returns HTTP 500 so Stripe retries. This reconciles a delayed browser request; it does not yet independently create an Order if the browser never submits checkout.

## 5. Nginx reverse proxy

Keep Node port 8000 private and proxy API traffic through Nginx. Example:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}
```

If Nginx already has a `/api/` location, merge these headers into it instead of adding a duplicate. Validate and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Set `TRUST_PROXY_HOPS=1` in backend `.env` only when exactly one trusted Nginx proxy is in front of Node. Do not expose port 8000 publicly.

## 6. Restart and verify

```bash
cd /path/to/amrdiy2/backend
node --check server.js
node --check controllers/user.js
node --check controllers/stripe.js
node --check controllers/stripeWebhook.js
node --check services/inventory.js
node --check services/cart-pricing.js
node --check services/cart-fingerprint.js
node --check services/create-order.js
node --check scripts/ensure-payment-unique-index.js
```

Restart using the actual PM2 process name:

```bash
pm2 restart amrdiy2-backend
pm2 logs amrdiy2-backend --lines 100
```

Check through Nginx:

```bash
curl -i https://YOUR_DOMAIN/api/health
```

Expected health JSON includes `database: "connected"`, `mongoTopology: "ReplicaSetWithPrimary"`, and `transactionsSupported: true`.

## 7. Frontend build and checkout verification

```bash
cd /path/to/amrdiy2/frontend
npm ci
npm run build
```

Use Stripe test mode first. Verify:
1. User A cannot submit User B's PaymentIntent.
2. Changing cart, coupon or shipping after creating a PaymentIntent rejects the old intent.
3. An out-of-stock item cannot create an Order.
4. Repeating the same successful PaymentIntent returns the existing Order and does not decrement stock again.
5. Webhook signature is valid and the matching Order is updated.
6. User order history and invoice show the purchased price snapshot, not the current product price.

Do not test live charges until test-mode checkout and webhook delivery are verified.
