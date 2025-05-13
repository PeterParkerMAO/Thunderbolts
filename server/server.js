require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 3000;

pool.connect()
    .then(() => {
        console.log('Conectado ao banco PostgreSQL');
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Erro ao conectar no banco de dados:', err);
        process.exit(1);
    });
