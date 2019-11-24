// Externalized DB Connection info
const keys = require('./keys');

// Express app setup - Lightweight Web Application framework for node
const express = require('express');

// Enable request body to be adapted into other structures like JSON
const bodyParser = require('body-parser');

// Enable cross origin resource sharing so that client request initially received by React Node server can be forwarded to express webserver
const cors = require('cors');


const app = express();
app.use(cors());
app.use(bodyParser.json());


//postgres client setup - import a named module from pg as opposed to the default module that is exported.
const {Pool} = require('pg');

const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort

});

pgClient.on('error', () => console.log('Lost PG connection'));

pgClient.query('CREATE TABLE IF NOT EXISTS values(number INT)')
.catch( ( err => console.log(err)));

const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000

});

//A redis client that publishes or subscribes to redis cannot be used for other interactions.
// Duplicate the redis client for publishing events.
const redisPublisher = redisClient.duplicate();


// Express route handlers

app.get('/', (req,res) => {
  res.send('Hi');
});


app.get('/values/all', async(req, res) => {
  const values = await pgClient.query("SELECT * from values");
  res.send(values.rows);
});


app.get('/values/current', async( req, res) => {
    redisClient.hgetall('values', (err, values) => {
     res.send(values);
    });  

});


app.post('/values', async(req, res) => {
   const index = req.body.index;
   if (parseInt(index) > 40){
      return res.status(422).send('Index too high');
   }

   redisClient.hset('values', index, 'Nothing yet!');
   redisPublisher.publish('insert', index);
   pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
   res.send({working: true});
});

app.listen(5000, err => {
  console.log('listening');
});
