'use strict';

// MODEL
const { User } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return User.bulkCreate([
      {
        email: 'superadmin@gmail.com',
        password: 'superadmin',
        user_level_id: 1,
      },
    ], {
      individualHooks: true
    });
  },

  async down (queryInterface, Sequelize) {
    return User.destroy({ where: {}, truncate: true });
  }
};
