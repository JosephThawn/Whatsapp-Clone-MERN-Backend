// importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

//app config
const app = express()
const port = process.env.PORT || 9000

//middleware
app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Headers", "*");
//   next();
// });



//pusher API
const pusher = new Pusher({
  appId: "1371787",
  key: "880b0a553e52bf96b7b4",
  secret: "e51f66f8279a41ea6da2",
  cluster: "eu",
  useTLS: true
});

// pusher.trigger("my-channel", "my-event", {
//   message: "hello world"
// });

//DB config@#$
const connection_url ="mongodb+srv://admin:KfofLlGM1hCfoFYy@cluster0.rzzuv.mongodb.net/whatsappdb?retryWrites=true&w=majority"
mongoose.connect(connection_url,{
  // useCreateIndex: true,
  //why useCreateIndex is not supported!
  useNewUrlParser: true,
  useUnifiedTopology: true,

});

const db = mongoose.connection
db.once('open', () => {
  console.log("DB connected");

  const msgCollection = db.collection('messagecontents')
  const changeStream = msgCollection.watch();


  changeStream.on('change', (change) => {
    console.log("A change occured", change);

    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger('messages', 'inserted',
        {
          name: messageDetails.name,
          message: messageDetails.message,
          received: messageDetails.received
        }
      )
    } else {
      console.log('Error triggering Pusher')
    }
  })
} )



//api routes
app.get('/', (req, res) => res.status(200).send('hello world'))

app.get('/messages/sync', (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.status(200).send(data)
    }
  })
})

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.status(201).send(data)
    }
  })
})

//listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
