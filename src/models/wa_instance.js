"use strict";

// NODE LIBS
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class WaInstance extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }
  WaInstance.init(
    {
      wa_instance_id: {
        type: DataTypes.STRING,
        autoIncrement: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "User",
          key: "user_id",
        },
        validate: {
          notEmpty: {
            args: true,
            msg: "user_id is required",
          },
          notNull: {
            msg: "user_id is required",
          },
        },
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      qr_code: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      session_data: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM,
        allowNull: true,
        values: [
          "qr",
          "ready",
          "authenticated",
          "auth_failure",
          "disconnected",
        ],
        defaultValue: "disconnected",
      },
      deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deleted_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "WaInstance",
      tableName: "wa_instance",
      timestamps: false,
      hooks: {},
    }
  );
  return WaInstance;
};
