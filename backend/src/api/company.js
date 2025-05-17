const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 建立公司
router.post("/", async (req, res) => {
  const { name, lat, lng } = req.body;
  try {
    const company = await prisma.company.create({
      data: { name, lat, lng },
    });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: "新增公司失敗", detail: err.message });
  }
});

// 取得所有公司
router.get("/", async (req, res) => {
  const companies = await prisma.company.findMany();
  res.json(companies);
});

module.exports = router;

