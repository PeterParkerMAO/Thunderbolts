const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/ranking.controller'); // ✅ correto

router.get('/', rankingController.getRanking);

module.exports = router;