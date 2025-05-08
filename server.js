const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const app = express();
const port = 3000;

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'thunderbolts_db',
    password: '1234',
    port: 5432,
});

client.connect();

app.use(cors());
app.use(express.json());

app.post('/times', async (req, res) => {
    const { nome } = req.body;
    try {
        const checkTimeExistente = await client.query('SELECT * FROM times WHERE nome = $1', [nome]);
        if (checkTimeExistente.rowCount > 0) {
            return res.status(400).json({ error: 'Time já cadastrado!' });
        }

        const result = await client.query('INSERT INTO times (nome) VALUES ($1) RETURNING *', [nome]);
        const time = result.rows[0];

        await client.query('INSERT INTO ranking (time_id, pontos, saldo_gols) VALUES ($1, 0, 0)', [time.id]);

        res.status(201).json(time);
    } catch (error) {
        console.error('Erro ao cadastrar time:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/times', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM times');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/jogos', async (req, res) => {
    let { time1_id, time2_id, placar_time1, placar_time2 } = req.body;

    if ([time1_id, time2_id, placar_time1, placar_time2].some(value => isNaN(value))) {
        return res.status(400).json({ error: 'Todos os parâmetros devem ser números válidos!' });
    }

    try {
        const timesExistentes = await client.query('SELECT id FROM times WHERE id IN ($1, $2)', [time1_id, time2_id]);
        if (timesExistentes.rowCount !== 2) {
            return res.status(400).json({ error: 'Um ou ambos os times não existem!' });
        }

        let pontosTime1 = placar_time1 > placar_time2 ? 3 : (placar_time1 === placar_time2 ? 1 : 0);
        let pontosTime2 = placar_time2 > placar_time1 ? 3 : (placar_time1 === placar_time2 ? 1 : 0);

        let saldoTime1 = placar_time1 - placar_time2;
        let saldoTime2 = placar_time2 - placar_time1;

        const jogoResult = await client.query('INSERT INTO jogos (time1_id, time2_id, placar_time1, placar_time2) VALUES ($1, $2, $3, $4) RETURNING id', [time1_id, time2_id, placar_time1, placar_time2]);

        await client.query('UPDATE ranking SET pontos = pontos + $1, saldo_gols = saldo_gols + $2 WHERE time_id = $3', [pontosTime1, saldoTime1, time1_id]);
        await client.query('UPDATE ranking SET pontos = pontos + $1, saldo_gols = saldo_gols + $2 WHERE time_id = $3', [pontosTime2, saldoTime2, time2_id]);

        res.status(200).json({ message: 'Jogo cadastrado e ranking atualizado!' });
    } catch (error) {
        console.error('Erro ao cadastrar jogo:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/ranking', async (req, res) => {
    try {
        const result = await client.query('SELECT t.nome, r.pontos, r.saldo_gols FROM ranking r JOIN times t ON r.time_id = t.id ORDER BY r.pontos DESC, r.saldo_gols DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/gerar-jogos', async (req, res) => {
    try {
        await client.query('TRUNCATE TABLE jogos RESTART IDENTITY');
        await client.query('UPDATE ranking SET pontos = 0, saldo_gols = 0');

        const times = await client.query('SELECT id FROM times');
        const jogos = [];

        for (let i = 0; i < times.rows.length; i++) {
            for (let j = i + 1; j < times.rows.length; j++) {
                jogos.push([times.rows[i].id, times.rows[j].id]);
            }
        }

        for (const [time1_id, time2_id] of jogos) {
            await client.query('INSERT INTO jogos (time1_id, time2_id, placar_time1, placar_time2) VALUES ($1, $2, 0, 0)', [time1_id, time2_id]);
        }

        res.status(200).json({ message: 'Jogos gerados e ranking zerado!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server rodando na porta ${port}`);
});
