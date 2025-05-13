const teamService = require('../services/team.service');

exports.createTeam = async (req, res) => {
    try {
        const { nome } = req.body;
        const result = await teamService.createTeam(nome);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getTeams = async (req, res) => {
    try {
        const result = await teamService.getTeams();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
