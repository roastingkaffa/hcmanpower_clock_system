const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = express.Router();

router.post('/login', async (req, res) => {
  const { account, password } = req.body;
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        account,
        password,
      },
    });
    if (!employee) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }
    return res.json({ user: employee });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '登入失敗' });
  }
});

module.exports = router;

