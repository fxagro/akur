with open('/root/deploy/.next/server/app/(auth)/login/page/page.js', 'r') as f:
    content = f.read()
content = content.replace('require("../../../chunks/ssr/', 'require("../../../../chunks/ssr/')
content = content.replace('R.c("server/chunks/ssr/', 'R.c("../../server/chunks/ssr/')
with open('/root/deploy/.next/server/app/(auth)/login/page/page.js', 'w') as f:
    f.write(content)
print('Done')