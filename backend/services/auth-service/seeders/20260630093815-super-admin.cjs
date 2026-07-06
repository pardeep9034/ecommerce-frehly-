'use strict';

const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

module.exports = {

    async up(queryInterface) {

        await queryInterface.bulkInsert(
            "auth_users",
            [
                {
                    uuid: randomUUID(),

                    first_name: "Super",

                    last_name: "Admin",

                    phone: "9999999999",

                    email: "admin@freshly.com",

                    password_hash: await bcrypt.hash(
                        "Admin@123",
                        12
                    ),

                    role: "SUPER_ADMIN",

                    phone_verified: true,

                    email_verified: true,

                    is_active: true,

                    auth_provider: "LOCAL",

                    created_at: new Date(),

                    updated_at: new Date()
                }
            ]
        );

    },

    async down(queryInterface) {

        await queryInterface.bulkDelete(
            "auth_users",
            {
                phone: "9999999999"
            }
        );

    }

};