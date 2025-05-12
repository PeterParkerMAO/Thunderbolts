const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000;

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'thunderbolts_db',
    password: '123456',
    port: 5432,
});

client.connect();

app.use(cors());
app.use(bodyParser.json());

app.post('/times', async (req, res) => {
    const { nome } = req.body;
    try {
        const result = await client.query(
            'INSERT INTO times (nome) VALUES ($1) RETURNING *',
            [nome]
        );
        const time = result.rows[0];

        await client.query(
            'INSERT INTO ranking (time_id, pontos, saldo_gols) VALUES ($1, 0, 0)',
            [time.id]
        );

        res.status(201).json(time);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/jogadores', async (req, res) => {
    const { nome, idade, time_id } = req.body;
    try {
        const result = await client.query(
            'INSERT INTO jogadores (nome, idade, time_id) VALUES ($1, $2, $3) RETURNING *',
            [nome, idade, time_id]
        );
        const jogador = result.rows[0];

        res.status(201).json(jogador);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/jogadores/:id', async (req, res) => {
    const { nome, idade, time_id } = req.body;
    const { id } = req.params;
    try {
        const result = await client.query(
            'UPDATE jogadores SET nome = $1, idade = $2, time_id = $3 WHERE id = $4 RETURNING *',
            [nome, idade, time_id, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({error: 'Jogador não encontrado!'});
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

app.post('/jogos', async (req, res) => {
    const { time1_id, time2_id, placar_time1, placar_time2 } = req.body;

    const time1Existente = await client.query('SELECT 1 FROM times WHERE id = $1', [time1_id]);
    const time2Existente = await client.query('SELECT 1 FROM times WHERE id = $1', [time2_id]);

    if (time1Existente.rowCount === 0 || time2Existente.rowCount === 0) {
        return res.status(400).json({ error: 'Um ou ambos os times não existem!' });
    }

    let pontosTime1 = 0, pontosTime2 = 0, saldoTime1 = placar_time1 - placar_time2, saldoTime2 = placar_time2 - placar_time1;
    if (placar_time1 > placar_time2) {
        pontosTime1 = 3;
    } else if (placar_time1 < placar_time2) {
        pontosTime2 = 3;
    } else {
        pontosTime1 = pontosTime2 = 1;
    }

    try {
        await client.query('INSERT INTO jogos (time1_id, time2_id, placar_time1, placar_time2) VALUES ($1, $2, $3, $4)', [time1_id, time2_id, placar_time1, placar_time2]);
        await client.query('UPDATE ranking SET pontos = pontos + $1, saldo_gols = saldo_gols + $2 WHERE time_id = $3', [pontosTime1, saldoTime1, time1_id]);
        await client.query('UPDATE ranking SET pontos = pontos + $1, saldo_gols = saldo_gols + $2 WHERE time_id = $3', [pontosTime2, saldoTime2, time2_id]);

        res.status(200).json({ message: 'Jogo cadastrado e ranking atualizado!' });
    } catch (error) {
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
        res.status(200).json({ message: 'Jogos gerados e ranking zerado!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server rodando na porta ${port}`);
});
