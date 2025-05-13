const { pool } = require('../config/db');

class GameService {
    async generateGames() {
        try {
            // await pool.query('TRUNCATE TABLE jogos RESTART IDENTITY');
            await pool.query('UPDATE ranking SET pontos = 0, saldo_gols = 0');

            const timesResult = await pool.query('SELECT id FROM times');
            const times = timesResult.rows.map(row => row.id);

            if (times.length < 2) throw new Error('Não há times suficientes para gerar jogos.');

            for (let i = times.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [times[i], times[j]] = [times[j], times[i]];
            }

            const jogos = [];
            for (let i = 0; i < times.length - 1; i += 2) {
                const time1_id = times[i];
                const time2_id = times[i + 1];

                await pool.query(
                    'INSERT INTO jogos (time1_id, time2_id, placar_time1, placar_time2) VALUES ($1, $2, 0, 0)',
                    [time1_id, time2_id]
                );

                const nomes = await pool.query(
                    'SELECT id, nome FROM times WHERE id = $1 OR id = $2',
                    [time1_id, time2_id]
                );

                jogos.push({
                    time1_id,
                    time2_id,
                    time1_nome: nomes.rows.find(t => t.id === time1_id)?.nome,
                    time2_nome: nomes.rows.find(t => t.id === time2_id)?.nome
                });
            }

            if (times.length % 2 !== 0) {
                const time_folga = times[times.length - 1];
                const nomeResult = await pool.query('SELECT nome FROM times WHERE id = $1', [time_folga]);
                console.log(`Time ${nomeResult.rows[0]?.nome} ficará de folga.`);
            }

            return { message: 'Jogos sorteados com sucesso!', jogos };
        } catch (err) {
            console.error("Erro ao gerar jogos: ", err);
            throw new Error('Erro ao gerar jogos');
        }
    }

    async clearGames() {
        try {
            await pool.query('TRUNCATE TABLE jogos RESTART IDENTITY');
            return { success: true, message: 'Jogos limpos com sucesso!' };
        } catch (err) {
            console.error("Erro ao limpar jogos: ", err);
            throw new Error('Erro ao limpar jogos');
        }
    }

    async saveScores(games) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const game of games) {
                const placarTime1 = Number(game.placar_time1);
                const placarTime2 = Number(game.placar_time2);

                await client.query(
                    `UPDATE jogos
                     SET placar_time1 = $1, placar_time2 = $2
                     WHERE time1_id = $3 AND time2_id = $4`,
                    [placarTime1, placarTime2, game.time1_id, game.time2_id]
                );

                const pontosTime1 = placarTime1 > placarTime2 ? 3 :
                    (placarTime1 === placarTime2 ? 1 : 0);
                const pontosTime2 = placarTime2 > placarTime1 ? 3 :
                    (placarTime1 === placarTime2 ? 1 : 0);

                await client.query(
                    `UPDATE ranking 
         SET pontos = pontos + $1::integer, 
             saldo_gols = saldo_gols + ($2::integer - $3::integer)
         WHERE time_id = $4`,
                    [pontosTime1, placarTime1, placarTime2, game.time1_id]
                );

                await client.query(
                    `UPDATE ranking
                     SET pontos = pontos + $1::integer, 
             saldo_gols = saldo_gols + ($2::integer - $3::integer)
                     WHERE time_id = $4`,
                    [pontosTime2, placarTime2, placarTime1, game.time2_id]
                );
            }

            await client.query('COMMIT');
            return { success: true, message: 'Placares atualizados com sucesso' };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro detalhado:', {
                message: error.message,
                query: error.query,
                stack: error.stack
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async getGames() {
        const result = await pool.query(`
            SELECT j.id, j.time1_id, t1.nome AS time1_nome,
                   j.time2_id, t2.nome AS time2_nome,
                   j.placar_time1, j.placar_time2
            FROM jogos j
                     JOIN times t1 ON j.time1_id = t1.id
                     JOIN times t2 ON j.time2_id = t2.id
        `);
        return result.rows;
    }
}


module.exports = new GameService();
