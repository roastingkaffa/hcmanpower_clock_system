const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 新增打卡紀錄
router.post("/", async (req, res) => {
  const { employeeId, companyId, type, location, time } = req.body;

  try {
    const record = await prisma.record.create({
      data: {
        employeeId,
        companyId,
        type,        // "Clock In" 或 "Clock Out"
        location,    // "25.0000, 121.0000"
        time,        // ISO 格式字串（例如 new Date().toISOString()）
      },
    });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: "新增打卡紀錄失敗", detail: err.message });
  }
});

// 查詢所有打卡紀錄
router.get("/", async (req, res) => {
  const records = await prisma.record.findMany({
    include: { employee: true, company: true },
    orderBy: { time: "desc" },
  });
  res.json(records);
});

router.post('/', async (req, res) => {
  const { employeeId, type, date, time, location } = req.body;
  try {
    const record = await prisma.record.create({
      data: {
        employeeId,
        type,
        date,
        time,
        location,
      },
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: '新增打卡紀錄失敗', detail: error.message });
  }
});


module.exports = router;

