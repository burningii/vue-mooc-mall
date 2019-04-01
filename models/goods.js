// 引入db.js
const mongoose = require('../utils/db')
// const Schema = mongoose.Schema

const GoodsScheam = new mongoose.Schema({
    "productId":{type:String},
    "productName":String,
    "salePrice":Number,
    // 商品选中状态
    "checked":String,
    // 是否为收藏商品0(否)1(是)
    "checkedLove":String,
    // 商品选中的数量
    "productNum":Number,
    "productImage":String
},{collection: 'goods'})

/*
*   model是由schema生成的模型，可以对数据库的操作
　　我们对上面的定义的user的schema生成一个User的model并导出
* */

module.exports = mongoose.model('Good', GoodsScheam)
