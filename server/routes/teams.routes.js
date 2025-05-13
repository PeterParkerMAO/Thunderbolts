const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teams.controller');

router.post('/', teamsController.createTeam);
router.get('/', teamsController.getTeams);

module.exports = router;
