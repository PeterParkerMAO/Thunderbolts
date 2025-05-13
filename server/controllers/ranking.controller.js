const rankingService = require('../services/ranking.service');

exports.getRanking = async (req, res) => {
    try {
        const result = await rankingService.getRanking();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
