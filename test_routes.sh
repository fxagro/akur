#!/bin/bash
echo '=== Login page ==='
curl -k -s -o /dev/null -w '%{http_code}' https://akur.mytriv.com/login 2>&1
echo ''

echo '=== Root redirect ==='
curl -k -s -o /dev/null -w '%{http_code}' https://akur.mytriv.com/ 2>&1
echo ''

echo '=== Protected routes (unauthenticated) ==='
for path in dashboard accounts journals ledger sales purchases "reports/trial-balance"; do
    echo -n "$path: "
    curl -k -s -o /dev/null -w '%{http_code}' "https://akur.mytriv.com/$path" 2>&1
    echo ''
done