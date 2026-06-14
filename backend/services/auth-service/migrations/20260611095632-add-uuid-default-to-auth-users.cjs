module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn(
            'auth_users',
            'uuid',
            {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
                defaultValue: Sequelize.UUIDV4
            }
        );
    },

    async down(queryInterface, Sequelize) {
       await queryInterface.dropTable('auth_users');
    }
};