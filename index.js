// Place your server entry point code here

const args = require('minimist')(process.argv.slice(2))

const help = (`
server.js [options]
--port, -p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug, -d If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help, -h	Return this message and exit.
`)
// If --help, echo help text and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}
var express = require('express')
var app = express()
const fs = require('fs')
const morgan = require('morgan')
const logdb = require('./src/services/database.js')
app.use(express.json());

const port = args.port || args.p || process.env.PORT || 5000

if (args.log == 'false') {
    console.log("NOTICE: not creating file access.log")
} else {

    const logdir = './log/';

    if (!fs.existsSync(logdir)){
        fs.mkdirSync(logdir);
    }

    const accessLog = fs.createWriteStream( logdir+'access.log', { flags: 'a' })

    app.use(morgan('combined', { stream: accessLog }))
}

app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    next();
})





/** Coin flip functions 
 * This module will emulate a coin flip given various conditions as parameters as defined below
 */

/** Simple coin flip
 * 
 * Write a function that accepts no parameters but returns either heads or tails at random.
 * 
 * @param {*}
 * @returns {string} 
 * 
 * example: coinFlip()
 * returns: heads
 * 
 */

 function coinFlip() {
    return Math.floor(Math.random() * 2) == 0 ? "tails" : "heads"
  }
  
  /** Multiple coin flips
   * 
   * Write a function that accepts one parameter (number of flips) and returns an array of 
   * resulting "heads" or "tails".
   * 
   * @param {number} flips 
   * @returns {string[]} results
   * 
   * example: coinFlips(10)
   * returns:
   *  [
        'heads', 'heads',
        'heads', 'tails',
        'heads', 'tails',
        'tails', 'heads',
        'tails', 'heads'
      ]
   */
  
  function coinFlips(flips) {
    if (flips < 1 || typeof flips ==="undefined"){
      flips = 1;
    }
    const results = [];
    for(var i = 0; i < flips; i++) {
      results.push(coinFlip());
    }
    return results;
  }
  
  /** Count multiple flips
   * 
   * Write a function that accepts an array consisting of "heads" or "tails" 
   * (e.g. the results of your `coinFlips()` function) and counts each, returning 
   * an object containing the number of each.
   * 
   * example: conutFlips(['heads', 'heads','heads', 'tails','heads', 'tails','tails', 'heads','tails', 'heads'])
   * { tails: 5, heads: 5 }
   * 
   * @param {string[]} array 
   * @returns {{ heads: number, tails: number }}
   */
  
  function countFlips(array) {
    let hNum = 0;
    let tailCount = 0;
    for (var i = 0; i < array.length; i++) {
      if(array[i].localeCompare('heads')) {
        hNum++;
      } else {
        tailCount++;
      } // we can assume only heads or tails as we are providing the array ourselves
    }
    return {heads: tailCount,tails: hNum};
  }
  
  /** Flip a coin!
   * 
   * Write a function that accepts one input parameter: a string either "heads" or "tails", flips a coin, and then records "win" or "lose". 
   * 
   * @param {string} call 
   * @returns {object} with keys that are the input param (heads or tails), a flip (heads or tails), and the result (win or lose). See below example.
   * 
   * example: flipACoin('tails')
   * returns: { call: 'tails', flip: 'heads', result: 'lose' }
   */
  
  function flipACoin(call) {
    let flip = coinFlip();
    return {call: call, flip: flip, result: flip == call ? "win" : "lose" }
  }
  
  
  /** Export 
   * 
   * Export all of your named functions
  
  export {coinFlip, coinFlips, countFlips, flipACoin};*/


  app.use(express.static('./public'))

  app.get("/app/", (req, res, next) => {
      res.json({"message":"Your API works! (200)"});
    res.status(200);
  });
  
  
  app.get('/app/flip/', (req, res) => {
      const flip = coinFlip()
      res.status(200).json({ "flip" : flip })
  });
  
  app.post('/app/flip/coins/', (req, res, next) => {
      const flips = coinFlips(req.body.number)
      const count = countFlips(flips)
      res.status(200).json({"raw":flips,"summary":count})
  })
  
  app.get('/app/flips/:number', (req, res, next) => {
      const flips = coinFlips(req.params.number)
      const count = countFlips(flips)
      res.status(200).json({"raw":flips,"summary":count})
  });
  
  app.post('/app/flip/call/', (req, res, next) => {
      const game = flipACoin(req.body.guess)
      res.status(200).json(game)
  })
  
  app.get('/app/flip/call/:guess(heads|tails)/', (req, res, next) => {
      const game = flipACoin(req.params.guess)
      res.status(200).json(game)
  })
  
  if (args.debug || args.d) {
      app.get('/app/log/access/', (req, res, next) => {
          const stmt = logdb.prepare("SELECT * FROM accesslog").all();
        res.status(200).json(stmt);
      })
  
      app.get('/app/error/', (req, res, next) => {
          throw new Error('Error test works.')
      })
  }
  
  
  app.use(function(req, res){
      const statusCode = 404
      const statusMessage = 'NOT FOUND'
      res.status(statusCode).end(statusCode+ ' ' +statusMessage)
  });
  
  // Start server
  const server = app.listen(port, () => {
      console.log("Server running on port %PORT%".replace("%PORT%",port))
  });
  
  process.on('SIGINT', () => {
      server.close(() => {
      console.log('\nApp stopped.');
    });
  });  