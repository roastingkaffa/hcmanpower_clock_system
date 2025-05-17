const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// 新增員工
router.post('/', async (req, res) => {
  const { name, account, password, companyId, shift } = req.body;

  try {
    // 先建立員工
    const employee = await prisma.employee.create({
      data: {
        name,
        account,
        password,
        status: 'active',
      },
    });

    // 建立員工與公司的關聯
    await prisma.employeeCompany.create({
      data: {
        employeeId: employee.id,
        companyId,
      },
    });

    res.json({ message: '新增員工成功', employee });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: '帳號已存在，請使用其他 account 名稱' });
    } else {
      res.status(500).json({ error: '新增員工失敗', detail: error.message });
    }
  }
});

// 取得所有員工（可選）
router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        companies: {
          include: {
            company: true,
          },
        },
      },
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: '取得員工列表失敗', detail: error.message });
  }
});

module.exports = router;

