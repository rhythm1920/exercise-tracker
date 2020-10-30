const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");

const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const Schema = mongoose.Schema;
dotenv.config();
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
app.post("/api/exercise/add", (req, res, next) => {
  // more work neede here. This commit may or may not work
  User.findById(req.body.userId, (err, data) => {
    data.log.push({
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: new Date(req.body.date),
    });
  });
  //body content - {{"userId": id of document ,"description": string ,"duration": number in string ,"date": date string}}
  // Needed reponse - {{"_id": id of document,"username":username,"date":date in "day month date(num) year(num)","duration": number of minutes of exercise ,"description": description of exercise}}
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
