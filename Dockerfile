# استخدم صورة رسمية لـ Node.js
FROM node:18

# تحديد مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات package.json و package-lock.json لتثبيت الحزم فقط عند التغيير
COPY package*.json ./

# تثبيت الحزم
RUN npm install

# نسخ باقي ملفات المشروع
COPY . .

# تعيين المنفذ الذي سيعمل عليه التطبيق
EXPOSE 3000

# تشغيل التطبيق عند بدء الحاوية
CMD ["node", "server.js"]
