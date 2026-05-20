// 1. Importar las librerías express, mysql2 y dotenv
const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(express.json()); // Para que el servidor entienda datos en formato JSON
app.use(express.static('public')); // Sirve tus archivos HTML, CSS y JS automáticos

// 2. Configurar el pool de conexión a la base de datos usando las variables de proceso del archivo .env
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convertimos el pool para usar promesas, así es más fácil programar con Copilot
const db = pool.promise();

// ==========================================
// AQUÍ ABAJO COMIENZAN LAS RUTAS DE TU API
// ==========================================

// Ruta para inicializar la semana (usada por admin.html)
app.post('/api/incidencias/inicializar', async (req, res) => {
    try {
        const { num_semana, anio } = req.body;
        
        const querySQL = `
            INSERT INTO historico_incidencias (num_semana, anio, id_empleado, faltas, vacaciones, permisos_con_goce, horas_extra, participacion, permiso_horas, comentarios)
            SELECT ?, ?, id_empleado, 0, 0, 0, 0, 0, 0, ''
            FROM empleados;
        `;

        await db.query(querySQL, [parseInt(num_semana), parseInt(anio)]);
        res.json({ message: `Semana ${num_semana} del año ${anio} inicializada correctamente.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Ruta para actualizar incidencias (usada por area.html)
app.put('/api/incidencias/actualizar', async (req, res) => {
    try {
        const { id_incidencia, faltas, vacaciones, permisos_con_goce, horas_extra, participacion, permiso_horas, comentarios } = req.body;

        const querySQL = `
            UPDATE historico_incidencias 
            SET faltas = ?, vacaciones = ?, permisos_con_goce = ?, horas_extra = ?, participacion = ?, permiso_horas = ?, comentarios = ?
            WHERE id_incidencia = ?;
        `;

        const comentarioFinal = (comentarios && comentarios.trim() !== '') ? comentarios.trim() : 'Vacío';

        await db.query(querySQL, [
            parseFloat(faltas) || 0,
            parseFloat(vacaciones) || 0,
            parseFloat(permisos_con_goce) || 0,
            parseInt(horas_extra) || 0,
            parseInt(participacion) || 0,
            parseInt(permiso_horas) || 0,
            comentarioFinal,
            id_incidencia
        ]);

        res.json({ message: "Registro de incidencias actualizado con éxito." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Ruta para consultar incidencias por área y semana (usada por area.html y admin.html)
app.get('/api/incidencias/por-area', async (req, res) => {
    try {
        const { area, num_semana } = req.query;

        const querySQL = `
            SELECT 
                h.id_incidencia, h.num_semana, h.anio, e.nombre, e.puesto, e.area, 
                h.faltas, h.vacaciones, h.permisos_con_goce, h.horas_extra, 
                h.participacion, h.permiso_horas, h.comentarios, h.dias_periodo
            FROM historico_incidencias h
            INNER JOIN empleados e ON h.id_empleado = e.id_empleado
            WHERE e.area = ? AND h.num_semana = ?;
        `;

        const [rows] = await db.query(querySQL, [area, parseInt(num_semana)]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Levantar el servidor en el puerto especificado en el .env
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor web corriendo en http://localhost:${PORT}`);
});