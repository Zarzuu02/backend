const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const Usuario = require("./Usuario");

const Cliente = sequelize.define("Cliente", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER, unique: true, references: { model: Usuario, key: "id" } },
});

Cliente.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

module.exports = Cliente;
