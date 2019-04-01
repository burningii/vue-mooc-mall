
const mongoose = require('mongoose')

// 开始连接MongoDB
mongoose.connect(`mongodb://localhost/moocmall`,{useNewUrlParser:true})
// console.log(process.env.VUE_APP_DB_URL)

// 连接成功
mongoose.connection.on('connected', () => {
    console.log(`连接成功`)
})

// 连接异常
mongoose.connection.on('error', (err) => {
    console.log(`连接异常：${err}`)
})

// 连接断开
mongoose.connection.on('disconnected', ()=>{
    console.log(`连接断开...`)
})

// 导出模块
module.exports = mongoose;
