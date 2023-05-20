const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const app = express();

// setting up DB
const mongs = require("mongoose");
mongs.set("strictQuery", false);
require("dotenv").config(); // load .env data
const db_uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWD}@dbclst0.fadtg3n.mongodb.net/local_library?retryWrites=true&w=majority`;

mongs
    .connect(db_uri)
    .then(() => console.log("-- connected to db"))
    .catch((err) => console.error(err.message));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use("/", require("./routes/index"));
app.use("/catalog", require("./routes/catalog"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error", {
        title: "Server Error",
        error: err,
    });
});

module.exports = app;
