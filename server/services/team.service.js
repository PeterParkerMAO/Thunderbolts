const { pool } = require('../config/db');

class TeamService {
    async createTeam(nome) {
        const existing = await pool.query('SELECT * FROM times WHERE nome = $1', [nome]);
        if (existing.rowCount > 0) throw new Error('Time já cadastrado!');

        const result = await pool.query('INSERT INTO times (nome) VALUES ($1) RETURNING *', [nome]);
        const time = result.rows[0];

        await pool.query('INSERT INTO ranking (time_id, pontos, saldo_gols) VALUES ($1, 0, 0)', [time.id]);
        return time;
    }

    async getTeams() {
        const result = await pool.query('SELECT * FROM times');
        return result.rows;
    }
}

module.exports = new TeamService();
