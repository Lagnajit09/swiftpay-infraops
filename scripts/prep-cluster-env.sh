#!/usr/bin/env bash
# prep-cluster-env.sh
#
# Produces cluster-ready env files from each service's .env.prod, swapping
# the external Supabase/Upstash URLs for IN-CLUSTER Kubernetes DNS URLs
# (postgres:5432, redis:6379). Output goes to ./cluster-env/ which is
# gitignored — real credentials never enter git.
#
# Run locally (WSL), then scp the whole cluster-env/ folder to the Oracle box.
#
# What it changes per file:
#   DATABASE_URL / DIRECT_URL  → in-cluster postgres, DB=swiftpaydb, schema kept
#   REDIS_URL                  → redis://redis:6379  (in-cluster, non-TLS)
# Everything else (EmailJS, JWT, S2S secrets, PORT, NODE_ENV) is copied as-is.
set -euo pipefail

cd "$(dirname "$0")/.."   # repo root
OUT="cluster-env"
mkdir -p "$OUT"

# Map: output-name  →  source .env.prod path  →  schema name
# schema names match what the base migrations expect on the in-cluster DB.
declare -A SRC=(
  [main]="services/main/.env.prod"
  [auth-service]="services/auth-service/.env.prod"
  [wallet-service]="services/wallet-service/.env.prod"
  [transaction-service]="services/transaction-service/.env.prod"
  [payment-service]="services/payment-service/.env.prod"
)
declare -A SCHEMA=(
  [auth-service]="auth_service"
  [wallet-service]="wallet_service"
  [transaction-service]="transaction_service"
  [payment-service]="payment_service"
)

PG_PASS="swiftpay_pg_pass"   # must match k8s/base/infrastructure/postgres/secret.yaml

for name in "${!SRC[@]}"; do
  src="${SRC[$name]}"
  [ -f "$src" ] || { echo "SKIP $name — $src not found"; continue; }
  out="$OUT/$name.env"

  # Start from the real .env.prod, then override DB/Redis lines.
  # We strip:
  #   - DATABASE_URL/DIRECT_URL/REDIS_URL → re-appended as in-cluster URLs
  #   - NODE_ENV/PORT/FRONTEND_URL → these belong in ConfigMaps, not Secrets.
  #     (envFrom applies secretRef AFTER configMapRef, so a secret copy of
  #     FRONTEND_URL would override the prod ConfigMap's CORS origin. Strip it.)
  grep -vE '^(DATABASE_URL|DIRECT_URL|REDIS_URL|NODE_ENV|PORT|FRONTEND_URL)=' "$src" > "$out"

  if [ -n "${SCHEMA[$name]:-}" ]; then
    schema="${SCHEMA[$name]}"
    {
      echo "DATABASE_URL=postgresql://postgres:${PG_PASS}@postgres:5432/swiftpaydb?schema=${schema}"
      echo "DIRECT_URL=postgresql://postgres:${PG_PASS}@postgres:5432/swiftpaydb?schema=${schema}"
    } >> "$out"
  fi

  # Re-add REDIS_URL only if the source had one (main + auth + txn + payment do)
  if grep -qE '^REDIS_URL=' "$src"; then
    echo "REDIS_URL=redis://redis:6379" >> "$out"
  fi

  echo "wrote $out"
done

echo
echo "Done. Cluster-ready env files are in ./$OUT/ (gitignored)."
echo "Next: scp the folder to the Oracle box."
