export
const twitterCredentials = {
  consumer_key: process.env.SECRET_CONSUMER_KEY || 'CONSUMER_KEY',
  consumer_secret: process.env.SECRET_CONSUMER_SECRET || 'CONSUMER_SECRET',
  access_token: process.env.SECRET_ACCESS_TOKEN || 'ACCESS_TOKEN',
  access_token_secret: process.env.SECRET_ACCESS_TOKEN_SECRET || 'ACCESS_TOKEN_SECRET'
};
