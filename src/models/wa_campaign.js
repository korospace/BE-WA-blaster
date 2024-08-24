"use strict";

// NODE LIBS
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class WaCampaign extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }
  WaCampaign.init(
    {
      wa_campaign_id: {
        type: DataTypes.INTEGER,
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
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: "text is required",
          },
          notNull: {
            msg: "text is required",
          },
        },
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
      modelName: "WaCampaign",
      tableName: "wa_campaign",
      timestamps: false,
      hooks: {},
    }
  );
  return WaCampaign;
};
