const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
let bodyParser = require('body-parser')
let mongoose = require('mongoose');

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true});

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

const userSchema = new mongoose.Schema({
  username: String
});

const User = mongoose.model("User", userSchema);

app.post("/api/users", (req, res) => {
  // insert user in database
  let bodyUsername = req.body.username;

  let newUser = new User({
    username: bodyUsername
  });

  newUser.save((err, data) => {
    if (err) return console.error(err);

    // return user model
    User.findOne({username: bodyUsername}, (err, data) => {
      if (err) return console.error(err);

      res.json(data);
    });
  });
});

app.get("/api/users", (req, res) => {
  // get all users from database
  User.find({}, (err, data) => {
    if (err) return console.error(err);

    // return array of user model
    res.json(data);
  })
})

app.post("/api/users/:_id/exercises", (req, res) => {
  // insert exercise in database
  let userId = req.params._id;
  let descriptionBody = req.body.description;
  let durationBody = req.body.duration;
  let dateBody = new Date();

  if (req.body.date) {
    dateBody = new Date(Date.parse(req.body.date));
  }

  User.findById(userId, (err, dataUser) => {
    if (err) return console.log(err);

    let usernameEx = dataUser.username;

    let newExercise = new Exercise({
      username: usernameEx,
      description: descriptionBody,
      duration: durationBody,
      date: dateBody
    });

    newExercise.save((err, dataExercise) => {
      if (err) return console.error(err);

      res.json({
        username: dataUser.username,
        _id: dataUser._id,
        description: newExercise.description,
        duration: newExercise.duration,
        date: new Date(Date.parse(newExercise.date)).toDateString()
      });
    });
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  // get all exercise log from user
  let userId = req.params._id;
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;

  User.findById(userId, (err, dataUser) => {
    if (err) return console.error(err);

    let exerciseQuery = Exercise.find({username: dataUser.username});

    if (from && to) {
      exerciseQuery = Exercise.find({username: dataUser.username, date: {$gte: new Date(Date.parse(from)), $lte: new Date(Date.parse(to))}});
    }
    
    if (limit) {
      exerciseQuery.limit(Number(limit));
    }

    exerciseQuery.exec((err, dataExercises) => {
      if (err) return console.error(err);

      let response = {
        username: dataUser.username,
        _id: dataUser._id,
        count: dataExercises.length,
        log: dataExercises.map(exercise => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString()
        }))
      };

      res.json(response);
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
