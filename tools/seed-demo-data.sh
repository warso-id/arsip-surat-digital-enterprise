#!/bin/bash
# seed-demo-data.sh - Generate Demo Data

GAS_URL="https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec"

echo "Seeding demo data..."

# Seed roles
curl -X POST "$GAS_URL" \
    -H "Content-Type: application/json" \
    -d '{"action":"seed_roles"}'

# Seed admin user
curl -X POST "$GAS_URL" \
    -H "Content-Type: application/json" \
    -d '{"action":"seed_admin"}'

# Seed categories
curl -X POST "$GAS_URL" \
    -H "Content-Type: application/json" \
    -d '{"action":"seed_categories"}'

# Seed instansi
curl -X POST "$GAS_URL" \
    -H "Content-Type: application/json" \
    -d '{"action":"seed_instansi"}'

# Seed demo surat masuk (20 records)
curl -X POST "$GAS_URL" \
    -H "Content-Type: application/json" \
    -d '{"action":"seed_demo_surat_masuk","count":20}'

# Seed demo surat keluar (15 records)
curl -X POST "$GAS_URL" \
    -H "Content-Type: application/json" \
    -d '{"action":"seed_demo_surat_keluar","count":15}'

# Seed demo disposisi (10 records)
curl -X POST "$GAS_URL" \
    -H "Content-Type: application/json" \
    -d '{"action":"seed_demo_disposisi","count":10}'

echo "Demo data seeded successfully!"
echo ""
echo "Default login:"
echo "Email: admin@enterprise.com"
echo "Password: admin123"
