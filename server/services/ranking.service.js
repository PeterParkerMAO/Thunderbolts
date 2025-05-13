const { pool } = require('../config/db');

class RankingService {
    async getRanking() {
        const result = await pool.query(`
      SELECT t.nome, r.pontos, r.saldo_gols
      FROM ranking r
      JOIN times t ON r.time_id = t.id
      ORDER BY r.pontos DESC, r.saldo_gols DESC
    `);
        return result.rows;
    }
}

module.exports = new RankingService();
