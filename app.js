const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
// 引入session
const session = require('express-session')


const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const goodsRouter = require('./routes/goods')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// 更换为ejs模板引擎
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use('public',express.static('public'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// 拦截器
app.use(function (req, res, next) {
    // console.log(req.session)
    next()
})
// 配置session
app.use(session({
    secret: 'secretTest', // 对session ID相关的cookie进行签名
    resave: true,
    saveUninitialized: true, // 是否保存为初始化的会话
    cookie: {
        maxAge: 1000 * 60 * 60 *24 *10, // 设置cookie的有效时间，单位毫秒
    }
}))

// app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/goods', goodsRouter);

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
