import dotenv from 'dotenv';
dotenv.config();

console.log('Environment variables test:');
console.log('BOT_TOKEN loaded:', !!process.env.BOT_TOKEN);
console.log('CLIENT_ID loaded:', !!process.env.CLIENT_ID);
console.log('MONGO_URI loaded:', !!process.env.MONGO_URI);

if (process.env.BOT_TOKEN) {
    console.log('BOT_TOKEN starts with:', process.env.BOT_TOKEN.substring(0, 20) + '...');
}
