const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const Usuario = require("./Usuario");

const Peluquero = sequelize.define("Peluquero", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER, unique: true, references: { model: Usuario, key: "id" } },
  especialidad: { type: DataTypes.STRING, allowNull: false },
  horario_inicio: { type: DataTypes.TIME, allowNull: false },
  horario_fin: { type: DataTypes.TIME, allowNull: false },
});

Peluquero.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

module.exports = Peluquero;
