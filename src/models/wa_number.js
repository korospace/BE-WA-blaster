'use strict';

// NODE LIBS
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WaNumber extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  WaNumber.init({
    wa_number_id: {
      type: DataTypes.INTEGER,
      autoIncrement: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'user_id'
      },
      validate: {
        notEmpty: {
          args: true,
          msg: "user_id is required"
        },
        notNull: {
          msg: 'user_id is required'
        }
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      // validate: {
      //   notEmpty: {
      //     args: true,
      //     msg: "name is required"
      //   },
      //   notNull: {
      //     msg: 'name is required'
      //   }
      // }
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "number is required"
        },
        notNull: {
          msg: 'number is required'
        }
      }
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'WaNumber',
    tableName: 'wa_number',
    timestamps: false,
    hooks: {
      beforeCreate: (wa_number,opt) => {
        wa_number.name = wa_number.name ? wa_number.name : `number-${wa_number.number}`;
      },
    }
  });
  return WaNumber;
};