const { createClient } = require('redis');
const redisClient = createClient();
redisClient.connect().catch(console.error);
module.exports = redisClient;
