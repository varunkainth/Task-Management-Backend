import pkg from 'pg';  // Default import for CommonJS modules
const { Client } = pkg;  // Destructure to get the Client class
const client = new Client(process.env.PostgreSQL_URI);
// Function to create a new connection
async function connectToDatabase() {
  
  
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL');
    return client; // Return client instance for future queries
  } catch (err) {
    console.error('Connection error', err.stack);
    throw new Error('Failed to connect to database');
  }
}

// Function to close the connection
async function closeConnection() {
  try {
    await client.end();
    console.log('Connection closed');
  } catch (err) {
    console.error('Error closing connection', err.stack);
  }
}



export { connectToDatabase, closeConnection,  }; // Export functions for use in other files
