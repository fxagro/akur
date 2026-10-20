import json
with open('/root/deploy/.next/server/app-paths-manifest.json', 'r') as f:
    data = json.load(f)
for key, value in list(data.items()):
    if 'login' in key and value == 'app/(auth)/login/page/page.js':
        data[key] = 'app/(auth)/login/page.js'
with open('/root/deploy/.next/server/app-paths-manifest.json', 'w') as f:
    json.dump(data, f, indent=2)
print('Done')