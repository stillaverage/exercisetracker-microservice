const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
const { FindOperators } = require('mongodb');
mongoose.connect(process.env.MONGODB_URL);

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  }
});

let exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  let userDoc = await User.findOne({ username })
  if (!userDoc) {
    const newUser = await User.create({ username });
    userDoc = await User.findOne({ username });
  };
  const _id = userDoc._id;
  res.json({
    username,
    _id
  });
});

app.get('/api/users', async (_req, res) => {
  const listOfUsers = await User.find({});
  res.json(listOfUsers);
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userDoc = await User.findById(req.params._id);
  if (!userDoc) {
    res.json({ error: "Invalid User" })
  } else {
    const username = userDoc.username
    const _id = userDoc._id

    const description = req.body.description;
    const duration = parseInt(req.body.duration);

    let date = req.body.date;
    // const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
    if (!date) {
      date = new Date(Date.now()).toDateString();
    } else {
      const parts = date.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);

      const utcDate = new Date(Date.UTC(year, month, day));
      date = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000).toDateString();
    };

    const newExercise = await Exercise.create({ username, description, duration, date });

    res.json({ username, description, duration, date, _id });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const userDoc = await User.findById(req.params._id);
  if (!userDoc) {
    res.json({
      error: "Invalid user"
    });
  } else {
    const username = userDoc.username;
    const _id = userDoc._id;
    // const log = await Exercise.find({ username }, { _id: 0, description: 1, duration: 1, date: 1 });
    // const count = log.length;
    
    let from;
    let to;

    if (req.query.from) {
      // from = new Date(req.query.from);
      const parts = req.query.from.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);

      const utcDate = new Date(Date.UTC(year, month, day));
      from = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000).toDateString();
    } else {
      from = new Date(0).toDateString();
    }

    // console.log(from)

    if (req.query.to) {
      // to = new Date(req.query.to)
      const parts = req.query.to.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);

      const utcDate = new Date(Date.UTC(year, month, day));
      to = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000).toDateString();
    } else {
      to = new Date(Date.now()).toDateString();
    }
    
    // console.log(to)

    let log = await Exercise.find({ username }).select({ _id: 0, description: 1, duration: 1, date: 1 });

    // if (req.query.limit) {
    //   log = await Exercise.find({ username, date: {$gte: from, $lte: to} }).select({ _id: 0, description: 1, duration: 1, date: 1 }).limit(parseInt(req.query.limit));
    // } else {
    //   log = await Exercise.find({ username, date: {$gte: from, $lte: to} }).select({ _id: 0, description: 1, duration: 1, date: 1 })
    // }

    log = log.filter((d, i) => new Date(d.date) >= new Date(from) && new Date(d.date) <= new Date(to))

    if (req.query.limit) {
      log = log.filter((d, i) => i < parseInt(req.query.limit))
    }

    count = log.length;

    res.json({
      username,
      _id,
      count,
      log
    });
  };
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
