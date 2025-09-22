const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 📌 نمایش index.html وقتی کاربر وارد سایت میشه
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 📌 اجازه دسترسی به فایل‌های استاتیک (css, js, تصاویر)
app.use(express.static(__dirname));

// 📌 دریافت قیمت لحظه‌ای بیت‌کوین از API بایننس
async function fetchBTCPrice() {
  try {
    const res = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    return parseFloat(res.data.price);
  } catch (err) {
    console.error("خطا در گرفتن قیمت:", err.message);
    return null;
  }
}

// 📌 وب‌سوکت برای ارسال قیمت به همه‌ی کلاینت‌ها
io.on("connection", (socket) => {
  console.log("یک بازیکن وصل شد ✅");

  socket.on("disconnect", () => {
    console.log("یک بازیکن خارج شد ❌");
  });
});

// 📌 هر ۵ ثانیه قیمت جدید رو بفرسته
setInterval(async () => {
  const price = await fetchBTCPrice();
  if (price) {
    io.emit("priceUpdate", price);
  }
}, 5000);

// 📌 پورت Render یا لوکال
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`سرور روی پورت ${PORT} بالا اومد 🚀`);
});
