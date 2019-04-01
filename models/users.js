// 引入db.js
const mongoose = require('../utils/db')
// const Schema = mongoose.Schema

const UsersScheam = new mongoose.Schema({
    'userId': String,
    'username': String,
    'password': String,
    'userDesc':String,
    'userGender':String,
    'userPic':String,
    'userCover':String,
    'userCollectonProducts':Array,
    'orderList':Array,
    'cartList':[
        {
            "productId":{type:String},
            "productName":String,
            "salePrice":Number,
            // 商品选中状态
            "checked":String,
            // 商品选中的数量
            "productNum":Number,
            "productImage":String
        }
    ],
    // 地址列表
    'addressList':[
        {
            'addressId':String,
            'username':String,
            'streetname':String,
            'postcode':String,
            'tel':String,
            'isDefault':Boolean
        }
    ]
}, { collection: 'users' })

/*
*   model是由schema生成的模型，可以对数据库的操作
　　我们对上面的定义的user的schema生成一个User的model并导出
* */

module.exports = mongoose.model('User', UsersScheam)
