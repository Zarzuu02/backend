const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const Cliente = require("./Cliente");
const Peluquero = require("./Peluquero");

const Cita = sequelize.define("Cita", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cliente_id: { type: DataTypes.INTEGER, references: { model: Cliente, key: "id" } },
  peluquero_id: { type: DataTypes.INTEGER, references: { model: Peluquero, key: "id" } },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora: { type: DataTypes.TIME, allowNull: false },
  estado: { type: DataTypes.ENUM("pendiente", "confirmada", "cancelada"), defaultValue: "pendiente" },
});

Cita.belongsTo(Cliente, { foreignKey: "cliente_id", as: "cliente" });
Cita.belongsTo(Peluquero, { foreignKey: "peluquero_id", as: "peluquero" });

module.exports = Cita;
