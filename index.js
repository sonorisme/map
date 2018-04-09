var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const MongoClient = require('mongodb').MongoClient;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/map.html');
});
// app.get('/time', function(req, res){
//   res.json()
// })
let mongoURL = "mongodb://NierSu:12345abc@ds247587.mlab.com:47587/bitcoinexchange"
// MongoClient.connect("mongodb://localhost:27017", function (err, client) {
//     let db = client.db('mydb')
//     let c = db.collection('myc')
MongoClient.connect(mongoURL, function (err, client) {
    let db = client.db('bitcoinexchange')
    let c = db.collection('traffic')
    let cache = new Promise(function(res, rej){
      c.find({ vehicleId: {$lte: 3}}).sort({time: 1}).toArray(function(err, data){
        if (err) {
          rej(err)
        }
        res(data)
        console.log('database cached.')
        client.close();
      })      
    })
    forwardData()
    async function forwardData(){
      cache = await cache
      io.on('connection', function (socket) {
        console.log("New connection established.")
        socket.emit('news', { hello: 'world' });
        socket.on('my other event', function (data) {
          console.log(data);
        });
        let slider = {}
        slider.min = cache[0].time
        slider.max = cache[cache.length - 1].time
        socket.emit('slider', slider)

        //sending coords
        let time
        let emission
        trigger(0, 1)
        function trigger(i, delay){
          emission = setTimeout(function(){
            socket.emit('coords', cache[i])
            if (cache[i+1]){
              time = cache[i].time
              delay = cache[i + 1].time - time
              trigger(i+1, delay)
            }
          }, delay)
        }

        socket.on('newTime', function(data){
          clearTimeout(emission)
          let i = cache.findIndex(function(x){
            return x.time >= data 
          })
          trigger(i, 1)
        })
        // let inception = 6270
        // let interval = setInterval(function(){
        //   if (inception == 19590){
        //     clearInterval(interval)
        //   }
        //   let coordinates = cache.filter(function(data){
        //     return data.time == inception 
        //   })
        //   socket.emit('coords', coordinates)
        //   inception = inception + 0.01
        // }, 0.01)

      });
    }
});



server.listen(3000, function(){
	console.log("Listening on port 3000.")
})