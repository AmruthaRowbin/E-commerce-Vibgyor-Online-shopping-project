var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyparser = require("body-parser");
const handlebars = require('handlebars')
const session = require('express-session');
const yup = require('yup');
//const flash = require('express-flash');
const flash = require('connect-flash');
const mathHelpers = require('./helpers/mathHelpers');
require('dotenv').config();
const nocache=require('nocache')

// var hbs = require('express-hbs')
handlebars.registerHelper(mathHelpers);
var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
const hbs = require('express-handlebars');

var db=require('./config/connection')

require('dotenv').config();


var app = express();

var fileUpload=require('express-fileupload')

app.use(nocache());



app.use(session({
  secret: 'your secret key', cookie:{maxAge:600000},// replace with a secret key for secure sessions
resave: false,
  saveUninitialized: false
}));

app.use(flash());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout',partialsDir:__dirname+'/views/partials/'}))
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

db.connect((err)=>{
  if(err) console.log('connection Error'+err)
  else console.log("database connected to port 27017")
})


app.use('/', indexRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
