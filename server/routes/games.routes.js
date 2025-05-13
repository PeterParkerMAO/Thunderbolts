const express = require('express');
const router = express.Router();
const gamesController = require('../controllers/games.controller');
const gameService = require('../services/game.service');

router.post('/gerar-jogos', gamesController.generateGames);
router.post('/placares', gamesController.saveScores);
router.get('/', gamesController.getGames);
router.post('/limpar-jogos', gamesController.clearGames);

module.exports = router;
