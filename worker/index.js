const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient(
  {
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
  }
);

const sub = redisClient.duplicate();

function fib(index) {

  if (index < 2 ) return 1;
  else 
    return fib(index - 1) + fib(index - 2);
}


//The message argument would have the index requested
sub.on('message', (channel, message) => 
{
  redisClient.hset('values', message, fib(parseInt(message)));
});

sub.subscribe("insert");
