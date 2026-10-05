const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Authenticate database connection
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected successfully.');
    } catch (dbErr) {
      console.error('❌ Database connection failed:', dbErr.message);
      if (process.env.DB_DIALECT !== 'sqlite') {
        console.log('💡 Tip: Ensure PostgreSQL is running and credentials in .env are correct.');
        console.log('💡 Or set DB_DIALECT=sqlite in backend/.env for instant zero-config testing.');
      }
      throw dbErr;
    }

    // Sync database schema (in development, alter tables if needed)
    await sequelize.sync({ alter: false });
    try {
      const queryInterface = sequelize.getQueryInterface();
      const tableDesc = await queryInterface.describeTable('users');
      if (!tableDesc.isRestricted) {
        const { DataTypes } = require('sequelize');
        await queryInterface.addColumn('users', 'isRestricted', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
        console.log('✅ Added "isRestricted" column to users table.');
      }
    } catch (migErr) {
      console.log('ℹ️ Schema verification notice:', migErr.message);
    }
    console.log('✅ Database schema synchronized.');

    // Start Express listener
    const server = app.listen(PORT, () => {
      console.log(`🚀 Restaurant Backend API running on port ${PORT}`);
      console.log(`🌐 Health check available at http://localhost:${PORT}/api/health`);
      console.log(`📁 Static uploads served at http://localhost:${PORT}/uploads/`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\nGracefully shutting down...');
      server.close(async () => {
        await sequelize.close();
        console.log('Database connection closed. Process exited.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
