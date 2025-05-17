const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.post("/login", async (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) return res.status(400).json({ message: "帳號密碼不可為空" });

  const employee = await prisma.employee.findUnique({ where: { account } });

  if (!employee || employee.password !== password) {
    return res.status(401).json({ message: "帳號或密碼錯誤" });
  }

  res.json({ message: "登入成功", employee });
});

module.exports = router;

