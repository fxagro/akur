#!/bin/bash
RESPONSE=$(curl -k -s -X POST -H 'Content-Type: application/x-www-form-urlencoded' -d 'email=admin@accurate.local&password=admin123' https://akur.mytriv.com/api/auth/login 2>&1)
echo "Response: $RESPONSE"
TOKEN=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
echo "Token: $TOKEN"
if [ -n "$TOKEN" ]; then
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/ 2>&1
    echo ''
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/dashboard 2>&1
    echo ''
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/accounts 2>&1
    echo ''
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/journals 2>&1
    echo ''
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/ledger 2>&1
    echo ''
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/reports/trial-balance 2>&1
    echo ''
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/reports/profit-loss 2>&1
    echo ''
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/reports/balance-sheet 2>&1
    echo ''
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/reports/cash-flow 2>&1
    echo ''
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/sales 2>&1
    echo ''
    curl -k -s -o /dev/null -w '%{http_code}' -H "Cookie: accurate_session=$TOKEN" https://akur.mytriv.com/purchases 2>&1
fi