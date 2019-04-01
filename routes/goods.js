const express = require('express')
const router = express.Router()
// 导入商品列表model
const goods = require('../models/goods')
const ObjectID = require('mongodb').ObjectID

/* 获取所有的商品列表 */
router.get('/list', function (req, res, next) {
    const userId = req.session.userId
    const User = require('../models/users')
    let userCollections = []
    console.log(`用户ID为：${userId}`)
    if (userId) {
        User.findOne({ _id: userId }, (err, userDoc) => {
            if (err) {
                console.log(err.message)
            } else {
                console.log('ok')
                if (userDoc) {
                    // console.log(`用户信息为：${userDoc}`)
                    userCollections = userDoc.userCollectonProducts
                }
            }
        })
    }
    // 获取请求的页码
    let page = parseInt(req.param('page'))
    // 获取请求的一页数量
    let pageSize = parseInt(req.param('pageSize'))
    // 获取价格区间的参数
    let priceClicked = req.param('priceClicked')
    // 获取排序规则的数据
    let sortFlag = req.param('sortFlag')
    // console.log(sortFlag)
    // 获取从多少条数据开始查询(即为跳过多少条数据)
    let skip = (page - 1) * pageSize
    // 定义价格区间值
    let priceGt = '', priceLte = ''
    // 定义参数
    let params = {}
    if (priceClicked != 'all') {
        switch (priceClicked) {
            case '0':
                priceGt = 0
                priceLte = 100
                break
            case '1':
                priceGt = 100
                priceLte = 500
                break
            case '2':
                priceGt = 500
                priceLte = 1000
                break
            case '3':
                priceGt = 1000
                priceLte = 2000
                break
        }

        params = {
            salePrice: {
                $gt: priceGt,
                $lte: priceLte
            }
        }
    }

    let GoodsModel = goods.find(params).skip(skip).limit(pageSize)
    GoodsModel.sort({ 'salePrice': sortFlag })

    GoodsModel.exec((err, doc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message
            })
        } else {
            if (doc) {
                // doc = doc.toJSON()
                // userCollections.forEach((item)=>{
                //     console.log(`用户收藏为：${item.productName}`)
                // })
                // console.log(typeof doc)
                // if (userId) {
                    for (let i = 0; i < doc.length; i++) {
                        doc[i].checkedLove = '0'
                    }
                    if (userCollections.length > 0) {
                        for (let i = 0; i < userCollections.length; i++) {
                            for (let j = 0; j < doc.length; j++) {
                                if (ObjectID(userCollections[i]._id).toString() == ObjectID(doc[j]._id).toString()) {
                                    doc[j].checkedLove = '1'
                                }
                            }
                        }
                    }
                // }
                // console.log(`doc为：${doc}`)
                res.json({
                    status: '0',
                    msg: '',
                    result: {
                        count: doc.length,
                        list: doc
                    }
                })
            }
        }
    })
})

function getUserCollectionsById (userId) {

}

// 添加到购物车
router.post('/addCart', function (req, res, next) {
    // 获取商品的ID值
    const goodsId = req.body.productId
    const User = require('../models/users')
    const userId = req.session.userId
    if (userId) {
        User.findOne({ '_id': userId }, (err, userDoc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message
                })
            } else {
                // console.log(userDoc)
                if (userDoc) {
                    // 如果用户信息(购物车列表)已经存在该商品，那么就将该商品的数量++
                    let goodsItem = ''
                    userDoc.cartList.forEach((item) => {
                        if (item._id == goodsId) {
                            goodsItem = item
                            item.productNum++
                        }
                    })
                    // 如果该商品有值，就直接执行保存操作
                    if (goodsItem) {
                        userDoc.save((err2, doc2) => {
                            if (err2) {
                                res.json({
                                    status: '1',
                                    msg: err2.message
                                })
                            } else {
                                res.json({
                                    status: '0',
                                    msg: '',
                                    result: 'success'
                                })
                            }
                        })
                    } else {
                        goods.findOne({ '_id': goodsId }, (err3, doc3) => {
                            if (err3) {
                                res.json({
                                    status: '1',
                                    msg: err3.message
                                })
                            } else {
                                if (doc3) {
                                    doc3.productNum = 1
                                    doc3.checked = 1
                                    userDoc.cartList.push(doc3)
                                    userDoc.save((err4, doc4) => {
                                        if (err4) {
                                            res.json({
                                                status: '1',
                                                msg: err4.message
                                            })
                                        } else {
                                            res.json({
                                                status: '0',
                                                msg: '',
                                                result: 'success'
                                            })
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            }
        })
    } else {
        res.json({
            status: '1',
            msg: '未登录'
        })
    }
})

module.exports = router
