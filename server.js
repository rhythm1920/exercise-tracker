const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const Schema = mongoose.Schema;
dotenv.config();
let date;
let users; // for storing all the data of users
let userData = []; // for storing only username and _id of user
//set up mongoDB
mongoose.connect(
  process.env.MLAB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    if (err) {
      console.error(err);
    }
    console.log("Connected to MongoDB");
  }
);

let userSchema = new Schema({
  username: String,
  count: Number,
  log: [{ description: String, duration: Number, date: Date }],
});
const User = mongoose.model("User", userSchema);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
//get end-point for getting all user [/api/exercise/users]
app.get("/api/exercise/users", (req, res, next) => {
  users = User.find({}, (err, data) => {
    if (err) return console.error(err);
    data.map((element) => {
      userData.push({ _id: element._id, username: element.username });
    });
  });
  res.send(userData);
});
//get end-point for exercise logs
app.get("/api/exercise/log", (req, res) => {
  let userId = req.query.userId;
  let toDate = req.query.to;
  let fromDate = req.query.from;
  let limit = req.query.limit;
  let log = [];
  User.findOne({ _id: userId }, (err, data) => {
    if (err) return console.error(err);
    log = [...data.log];
    if (toDate || fromDate) {
      log.map((exercise, index) => {
        if (
          new Date(exercise.date) >= new Date(toDate) ||
          new Date(exercise.date) <= new Date(fromDate)
        ) {
          log.splice(index, 1);
        }
      });
    }
    if (limit) {
      log = log.slice(0, parseInt(limit));
    }
    res.json({ logs: log, count: data.count });
  });
});
//post end-point for new user
app.post("/api/exercise/new-user/", (req, res, next) => {
  User.create(
    { username: req.body.username, count: 0, log: [] },
    (err, data) => {
      if (err) {
        console.error(err);
      }
      return res.json({ username: data.username, _id: ObjectId() });
    }
  );
});
//post end point for new exrcise
app.post("/api/exercise/add", (req, res, done) => {
  User.findOne({ _id: req.body.userId }, (err, data) => {
    if (err) return console.error(err);
    if (!req.body.date) {
      date = new Date();
    }
    data.count += 1;
    data.log.push({
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: req.body.date ? new Date(req.body.date) : date,
    });
    data.save((err, data) => {
      if (err) return console.error(err);
      res.json({
        _id: data._id,
        username: data.username,
        date: date.toDateString(),
        duration: req.body.duration,
        description: req.body.description,
      });
    });
  });
});
// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res.status(errCode).type("txt").send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
  console.log("http://localhost:" + listener.address().port);
});
