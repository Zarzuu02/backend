const { DataTypes } = require("sequelize");
const sequelize = require("../database"); // Importa la conexión a la BD

const Usuario = sequelize.define("Usuario", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  contrasena: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING, allowNull: false },
  sexo: { type: DataTypes.ENUM("Hombre", "Mujer"), allowNull: false },
  imagen: { type: DataTypes.STRING, allowNull: true }, // Nueva imagen opcional
  fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = Usuario;
