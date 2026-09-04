# Hyperion

SWEP exhibition project (Group H, University of Ilorin): cashless campus bus rides.

Students hold a wallet of **ride points** (₦250 = 1 point). A driver scans the student’s **QR code** (and later an **RFID card**). One successful scan deducts one point. Both QR and RFID hit the same API so they stay in sync.

This repository currently ships the **backend only** (`server/`). Next.js and React Native come later.

## Stack

- Node.js, Express 5, TypeScript
- MongoDB + Mongoose
- JWT auth (`admin` | `driver` | `student`)
- Paystack dedicated virtual account (permanent NUBAN) for deposits
- QR now; RFID UID on the same student record later

## Setup (backend)

1. Install [Node.js 20+](https://nodejs.org/) and [pnpm](https://pnpm.io/).
2. Create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster. Copy the connection string.
3. Optional: create a [Paystack](https://paystack.com/) test account for live deposits. You can demo without it using admin “add points”.
4. Configure env:

```bash
cd server
cp .env.example .env
# edit .env — at minimum MONGODB_URI and JWT_SECRET
pnpm install
pnpm seed
pnpm dev
```

Seed accounts:

| Role    | Email                    | Password        | PIN  | Notes            |
|---------|--------------------------|-----------------|------|------------------|
| admin   | `admin@hyperion.local`   | `ChangeMeAdmin1!` | —  | from `.env`      |
| driver  | `driver@hyperion.local`  | `DriverPass1!`  | —    |                  |
| student | `student@hyperion.local` | `StudentPass1!` | 1234 | 5 ride points    |

API: `http://localhost:5000`  
Health: `GET /health`

## Demo a ride with curl

```bash
# 1. Student login → copy token
curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@hyperion.local","password":"StudentPass1!"}'

# 2. Student QR payload (HYP:<token>)
curl -s http://localhost:5000/api/me/qr \
  -H "Authorization: Bearer STUDENT_JWT"

# 3. Driver login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"driver@hyperion.local","password":"DriverPass1!"}'

# 4. Driver scans QR (same as RFID later: method=rfid, token=<uid>)
curl -s -X POST http://localhost:5000/api/scans \
  -H "Authorization: Bearer DRIVER_JWT" \
  -H 'Content-Type: application/json' \
  -d '{"method":"qr","token":"HYP:...from step 2...","pin":"1234","requestId":"demo-1"}'
```

Success: `{ "ok": true, "remainingPoints": 4, ... }`  
No points: `{ "ok": false, "code": "INSUFFICIENT_POINTS" }`  
Wrong PIN: `{ "ok": false, "code": "BAD_PIN" }`

Admin add points (booth backup):

```bash
curl -s -X POST http://localhost:5000/api/admin/students/STUDENT_ID/points \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H 'Content-Type: application/json' \
  -d '{"deltaPoints":10,"note":"exhibition top-up"}'
```

Bind an RFID UID when hardware arrives:

```bash
curl -s -X POST http://localhost:5000/api/admin/students/STUDENT_ID/rfid \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H 'Content-Type: application/json' \
  -d '{"rfidUid":"04A3B12C"}'
```

Then the driver (or the reader box) posts `{ "method": "rfid", "token": "04A3B12C", "pin": "1234" }` to `/api/scans`. Wallet and trip history are the same as QR.

Headless reader: `POST /api/admin/devices` with `{ driverId, deviceLabel }` returns a one-time `apiKey`. Send it as header `X-Device-Key` instead of a JWT.

## Paystack deposits

1. Put `PAYSTACK_SECRET_KEY` in `.env` (test key is fine).
2. New students get a Paystack customer; dedicated NUBAN is created when your Paystack plan allows it.
3. Expose the API (`ngrok http 5000`) and set webhook URL to `https://YOUR_HOST/api/webhooks/paystack`.
4. Student transfers ₦250 (or more) to the account shown on `GET /api/me/wallet`.
5. Webhook credits **whole points**; leftover kobo waits for the next deposit (`₦300` → 1 point + ₦50 leftover).

Without Paystack, use admin point adjustments.

## API map

| Method | Path | Who |
|--------|------|-----|
| POST | `/api/auth/register` | public (students) |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | any logged-in |
| POST | `/api/auth/pin` | student |
| GET | `/api/me/wallet` | student |
| GET | `/api/me/qr` | student |
| GET | `/api/me/trips` | student |
| POST | `/api/scans` | driver or device key |
| GET | `/api/scans/trips` | driver |
| GET | `/api/admin/stats` | admin |
| GET/PATCH | `/api/admin/users` | admin |
| POST | `/api/admin/students`, `/drivers` | admin |
| POST | `/api/admin/students/:id/rfid` | admin |
| POST | `/api/admin/students/:id/points` | admin |
| GET | `/api/admin/trips` | admin |
| POST | `/api/webhooks/paystack` | Paystack |

## After the API: whole-project checklist

1. Confirm Mongo + seed + curl scan locally.
2. Paystack test webhook (or skip and use admin top-up for the booth).
3. **Tiny driver scan page** (Next.js or even a single HTML file): camera QR + PIN field → `POST /api/scans`. This is enough to exhibit.
4. **Student web:** login, account number, QR image (`qrcode` library + `/api/me/qr`), points, history.
5. **Admin web:** users, drivers, bind RFID, trips, stats.
6. **React Native:** student QR + driver scanner.
7. **Hardware:** RC522 / PN532 (or USB reader). Read UID → same scan endpoint. Admin binds UID to matric number.
8. **Booth:** 3 seeded students with points, 1 driver, live QR debit, admin trip list on a laptop.

## Security notes

- Do not commit `.env` or `secrets/`.
- Change seed passwords before any public deploy.
- PIN and passwords are bcrypt-hashed. QR tokens can be rotated if a phone is lost.
