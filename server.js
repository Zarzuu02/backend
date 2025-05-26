const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connection = require('./database');
require('dotenv').config();


const app = express();


app.use(bodyParser.json());
app.use(cors());

app.use(express.json({ limit: '50mb' })); 

const usuariosRoutes = require('./routes/usuarios');
const clientesRoutes = require('./routes/clientes');
const peluquerosRoutes = require('./routes/peluqueros');
const citasRoutes = require('./routes/citas');
require('./routes/cronJobs/confirmar_citas'); 
require('./routes/cronJobs/realizar_citas'); 
require('./routes/cronJobs/eliminar_citas_duplicadas'); 

app.use('/uploads', express.static('uploads'));


// Usamos las rutas con el prefijo correcto
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/peluqueros', peluquerosRoutes);  
app.use('/api/citas', citasRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
