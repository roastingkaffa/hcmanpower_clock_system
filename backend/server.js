// backend/server.js

const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");

const authRoutes = require("./src/api/auth"); // ✅ 登入功能
const companyRoutes = require("./src/api/company"); // ✅ 公司管理
const employeeRoutes = require("./src/api/employee"); // ✅ 員工管理
const recordRoutes = require("./src/api/record"); // ✅ 打卡紀錄

// 載入 .env 設定檔
dotenv.config();

const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

// API 路由前綴
// 將原本
// app.use("/auth", authRoutes);
// 改成：
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/records", recordRoutes);



// 首頁測試
app.get("/", (req, res) => {
  res.send("🟢 API Server is running");
});

// 啟動伺服器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});

