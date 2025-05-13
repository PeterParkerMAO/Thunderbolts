const gameService = require('../services/game.service');

exports.generateGames = async (req, res) => {
    try {
        const result = await gameService.generateGames();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getGames = async (req, res) => {
    try {
        const result = await gameService.getGames();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.saveScores = async (req, res) => {
    try {
        console.log('Dados recebidos:', req.body);

        const games = req.body;

        if (!Array.isArray(games)) {
            throw new Error('O payload deve ser um array de jogos');
        }

        const result = await gameService.saveScores(games);
        res.status(200).json(result);
    } catch (err) {
        console.error('Erro detalhado:', err);
        res.status(500).json({
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};
exports.clearGames = async (req, res) => {
    try {
        const result = await gameService.clearGames();
        res.status(200).json(result);
    } catch (err) {
        console.error('Erro ao limpar jogos:', err);
        res.status(500).json({
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};
