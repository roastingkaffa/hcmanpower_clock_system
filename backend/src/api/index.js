const express = require('express');
const router = express.Router();

// 匯入所有 route 模組
const auth = require('./auth');
const company = require('./company');
const employee = require('./employee');
const record = require('./record');

// 預設測試用路徑
router.get('/', (req, res) => {
  res.json({ message: 'API Root' });
});

// 註冊每一個模組的路由
router.use('/auth', auth);
router.use('/companies', company);
router.use('/employees', employee);
router.use('/records', record);

module.exports = router;

