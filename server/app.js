const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/times', require('./routes/teams.routes'));
app.use('/jogos', require('./routes/games.routes'));
app.use('/ranking', require('./routes/ranking.routes'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = app;
