import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mydatabase',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function getConnection() {
  return pool.getConnection();
}

export async function initDB() {
  console.log('Initializing database...');
  let connection;
  try {
    connection = await getConnection();
    console.log('Successfully connected to the database.');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS hosts (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ip_address VARCHAR(255) NOT NULL,
        ssh_port INT DEFAULT 22,
        status VARCHAR(50) NOT NULL,
        created_at BIGINT NOT NULL,
        containers JSON,
        cpu_usage FLOAT,
        memory_usage FLOAT,
        memory_used_gb FLOAT,
        memory_total_gb FLOAT,
        disk_usage FLOAT,
        disk_used_gb FLOAT,
        disk_total_gb FLOAT,
        history JSON
      )
    `;

    // Add TEXT type for history in MariaDB < 10.2
     const createTableQueryMariaDB = `
      CREATE TABLE IF NOT EXISTS hosts (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ip_address VARCHAR(255) NOT NULL,
        ssh_port INT DEFAULT 22,
        status VARCHAR(50) NOT NULL,
        created_at BIGINT NOT NULL,
        containers TEXT,
        cpu_usage FLOAT,
        memory_usage FLOAT,
        memory_used_gb FLOAT,
        memory_total_gb FLOAT,
        disk_usage FLOAT,
        disk_used_gb FLOAT,
        disk_total_gb FLOAT,
        history TEXT
      )
    `;

    try {
        await connection.query(createTableQuery);
        console.log('Table "hosts" created or already exists.');
    } catch (error) {
        console.log("Failed with JSON type, trying TEXT for older MariaDB versions.");
        await connection.query(createTableQueryMariaDB);
        console.log('Table "hosts" created or already exists with TEXT columns.');
    }


  } catch (error) {
    console.error('Database initialization failed:', error);
    // Exit the process if the database connection fails, as the app is unusable.
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
