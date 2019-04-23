import * as express from 'express';
import * as Twitter from 'twit';

import { twitterCredentials } from './config';

const app = express();
const port = 3000;

const twitterClient = new Twitter(twitterCredentials);

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
