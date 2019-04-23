import * as express from 'express';
import * as Twitter from 'twit';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';

import { twitterCredentials } from './config';

const app = express();
const port = 3000;

const twitterClient = new Twitter(twitterCredentials);

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/statuses/show/:id', (req, res) => {
  const tweetId: string = req.params.id;
  if (!tweetId || !tweetId.length || !/^\d+$/.test(tweetId)) {
    res.statusCode = 400;
    res.send('invalid tweet id');
    return;
  }
  twitterClient.get(`statuses/show/${tweetId}`)
    .then(apiResponse => res.send(apiResponse.data))
    .catch((error) => console.error(error))
    ;
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
