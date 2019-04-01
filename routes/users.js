const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
// const bodyParser = require('body-parser')
// const urlencodedParser = bodyParser.urlencoded({ extended: false })
const User = require('../models/users')
const ObjectID = require('mongodb').ObjectID
// 引入multer上传文件中间件
const multer = require('multer')
// 引入UUID
const uuid = require('node-uuid')
const fs = require('fs')

// 设置上传用户头像保存的路径
const storage = multer.diskStorage({
    destination (req, file, cb) {
        // console.log(file)
        if (file.fieldname == 'avatar') {
            let path = './public/userpic/' // 设置删除路径
            delDir(path) //执行删除
            fs.mkdirSync('./public/userpic/', '0755')
            cb(null, 'public/userpic/')
        } else if (file.fieldname == 'usercover') {
            let path = './public/usercover/' // 设置删除路径
            delDir(path) //执行删除
            fs.mkdirSync('./public/usercover/', '0755')
            cb(null, 'public/usercover/')
        }

    },
    filename (req, file, cb) {
        const filenameArr = file.originalname.split('.')
        cb(null, Date.now() + '-' + uuid.v1() + '.' + filenameArr[filenameArr.length - 1])
        // cb(null,'useracatar.jpg');
    }
})
const avatarUpload = multer({ storage })

// 定义删除指定文件夹下的所有文件（以及文件夹）
function delDir (path) {
    let files = []
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path)
        files.forEach((file, index) => {
            let curPath = path + '/' + file
            if (fs.statSync(curPath).isDirectory()) {
                delDir(curPath) // 递归删除文件夹
            } else {
                fs.unlinkSync(curPath) // 递归删除文件
            }
        })
        fs.rmdirSync(path)
    }
}

/* 用户登录 */
router.post('/login', function (request, response, next) {
    // console.log(request.body.username)
    let whereStr = {
        username: request.body.username,
        password: request.body.password,
    }
    // 获取自动登录的按钮点击与否
    let autoLoginBtn = request.body.autoLoginBtn
    User.findOne(whereStr, (err, res) => {
        if (err) {
            response.json({
                status: '1',
                msg: err.message
            })
        } else {
            if (res) {
                console.log(res.userPic)
                // 如果点击了按钮，就执行cookie设置
                if (autoLoginBtn) {
                    // 向客户端写入cookie,(key, value)
                    // 写入ID值
                    response.cookie('userId', res._id, {
                        path: '/',
                        maxAge: 1000 * 60 * 60 * 24 * 10
                    })
                    // 写入用户名
                    response.cookie('username', res.username, {
                        path: '/',
                        maxAge: 1000 * 60 * 60 * 24 * 10
                    })

                }
                // 设置session
                request.session.username = res.username
                request.session.userId = res._id
                request.session.userPic = res.userPic
                response.json({
                    status: '0',
                    msg: '',
                    result: {
                        username: res.username,
                        userPic: res.userPic,
                        userId: res._id,
                        userCover: res.userCover,
                        userCollectonProducts: res.userCollectonProducts,
                        userGender: res.userGender,
                        userDesc: res.userDesc
                    }
                })
            } else {
                response.json({
                    status: '2',
                    msg: '用户名或密码错误'
                })
            }
        }
    })
})

// 自动登录
router.get('/checkLogin', function (request, response, next) {
    // console.log('执行了')
    // console.log(request.session.username)
    if (request.session.username) {
        User.findOne({ '_id': request.session.userId }, (err, userDoc) => {
            if (err) {
                response.json({
                    status: '1',
                    msg: err.message
                })
            } else {
                if (userDoc) {
                    response.json({
                        status: '0',
                        msg: '',
                        result: {
                            username: request.session.username || '',
                            userId: request.session.userId,
                            userPic: userDoc.userPic,
                            userCover: userDoc.userCover,
                            userCollectonProducts: userDoc.userCollectonProducts,
                            userGender: userDoc.userGender,
                            userDesc: userDoc.userDesc
                        }
                    })
                }
            }
        })
    } else {
        response.json({
            status: '1',
            msg: '未登录',
            result: ''
        })
    }
    /* if (request.cookies.userId) {
         response.json({
             status: '0',
             msg: '',
             result: request.cookies.username || ''
         })
     } else {
         response.json({
             status: '1',
             msg: '未登录',
             result: ''
         })
     }*/
})

// 用户注销
router.post('/logOut', function (request, response, next) {
    // 删除session
    request.session.username = null
    request.session.userId = null
    // 直接向客户端清空原有的cookie
    response.cookie('userId', '', {
        path: '/',
        maxAge: -1
    })
    response.json({
        status: '0',
        msg: '',
        result: ''
    })
})

// 查询当前用户的购物车数据
router.get('/cartList', function (request, response, next) {
    const userId = request.session.userId
    if (userId) {
        User.findOne({ _id: userId }, (err, userDoc) => {
            if (err) {
                response.json({
                    status: '1',
                    msg: err.message
                })
            } else {
                if (userDoc) {
                    response.json({
                        status: '0',
                        msg: '',
                        result: userDoc.cartList
                    })
                }
            }
        })
    }
})

// 改变全选，反选
router.post('/changeCheckAll', function (request, response, next) {
    let checkedAll = request.body.checkedAll
    const userId = request.session.userId
    if (userId) {
        User.findOne({ _id: userId }, (err, userDoc) => {
            if (err) {
                response.json({
                    status: '1',
                    msg: err.message
                })
            } else {
                if (userDoc) {
                    userDoc.cartList.forEach((item) => {
                        if (checkedAll) {
                            item.checked = '1'
                        } else {
                            item.checked = '0'
                        }
                    })
                    userDoc.save((err2, doc2) => {
                        if (err2) {
                            response.json({
                                status: '1',
                                msg: err2.message
                            })
                        } else {
                            response.json({
                                status: '0',
                                msg: '',
                                result: 'success'
                            })
                        }
                    })
                } else {
                    response.json({
                        status: '1',
                        msg: '当前用户未登录'
                    })
                }
            }
        })
    }
})

// 编辑购物车checked，数量
router.post('/editCart', function (request, response, next) {
    const userId = request.session.userId
    let productId = request.body.productId,
        checked = request.body.checked,
        productNum = request.body.productNum
    User.update({ '_id': userId, 'cartList._id': productId }, {
        'cartList.$.productNum': productNum,
        'cartList.$.checked': checked
    }, (err, doc) => {
        if (err) {
            response.json({
                status: '1',
                msg: err.message
            })
        } else {
            response.json({
                status: '0',
                msg: '',
                result: 'success'
            })
        }
    })
})

// 删除购物车中的商品
router.post('/delCartItem', function (request, response, next) {
    const userId = request.session.userId
    let productId = request.body.productId
    User.update({ '_id': userId }, {
        $pull: {
            'cartList': {
                '_id': productId
            }
        }
    }, (err, doc) => {
        if (err) {
            response.json({
                status: '1',
                msg: err.message
            })
        } else {
            response.json({
                status: '0',
                msg: '',
                result: 'success'
            })
        }
    })
})

// 更改用户头像
router.post('/uploadPic', avatarUpload.single('avatar'), function (request, response, next) {
    const userId = request.session.userId
    // console.log(request.file.originalname)
    /*let filename = request.file.originalname.split('.')
    let dateNow = Date.now()
    let newFilename = dateNow+uuid.v1()+'.'+filename[1]*/
    //fs.renameSync(request.file.filename, newFilename);//这里修改文件名字，比较随意。
    // console.log(newFilename)
    // console.log(request.file.filename)
    User.findByIdAndUpdate(userId, { userPic: request.file.filename }, { new: true }).then(user => {
        if (user) {
            // console.log(user)
            response.json({
                status: '0',
                msg: '',
                result: {
                    userPic: user.userPic
                }
            })
        }
    })
})

// 更改用户封面图
router.post('/uploadUserCover', avatarUpload.single('usercover'), function (request, response, next) {
    const userId = request.session.userId
    // console.log(request.file.originalname)
    /*let filename = request.file.originalname.split('.')
    let dateNow = Date.now()
    let newFilename = dateNow+uuid.v1()+'.'+filename[1]*/
    //fs.renameSync(request.file.filename, newFilename);//这里修改文件名字，比较随意。
    // console.log(newFilename)
    // console.log(request.file.filename)

    User.findByIdAndUpdate(userId, { userCover: request.file.filename }, { new: true }).then(user => {
        if (user) {
            // console.log(user)
            // setTimeout(()=>{
            response.json({
                status: '0',
                msg: '',
                result: {
                    userCover: user.userCover
                }
            })
            // }, 3000)
        }
    })

})

// 用户收藏/取消收藏功能
router.post('/editUserLove', function (request, response, next) {
    const userId = request.session.userId
    let flag = request.body.flag
    let productId = request.body.productId

    if (userId) {
        if (flag == 'remove') {
            User.update({ '_id': userId }, {
                $pull: {
                    'userCollectonProducts': {
                        '_id': ObjectID(productId)
                    }
                }
            }, (err, doc) => {
                if (err) {
                    response.json({
                        status: '1',
                        msg: err.message
                    })
                } else {
                    User.findOne({ '_id': userId }, (err2, doc2) => {
                        if (err2) response.json({ status: '1', msg: err2.message })
                        response.json({
                            status: '0',
                            msg: '',
                            result: doc2.userCollectonProducts
                        })
                    })
                }
            })
        } else if (flag == 'add') {
            User.findOne({ '_id': userId }, (err, userDoc) => {
                if (err) {
                    response.json({
                        status: '1',
                        msg: err.message
                    })
                } else {
                    if (userDoc) {
                        if (productId) {
                            const Goods = require('../models/goods')
                            Goods.findOne({ '_id': productId }, (err2, proDoc) => {
                                if (err2) {
                                    response.json({
                                        status: '1',
                                        msg: err2.message
                                    })
                                } else {
                                    if (proDoc) {
                                        userDoc.userCollectonProducts.push(proDoc)
                                        userDoc.save((err3, doc2) => {
                                            if (err3) {
                                                response.json({
                                                    status: '1',
                                                    msg: err3.message
                                                })
                                            } else {
                                                response.json({
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
        }

    }
})

// 获取用户的地址列表
router.get('/addresslist', function (request, response, next) {
    const userId = request.session.userId
    if (userId) {
        let addressModel = User.findOne({ '_id': userId })
        addressModel.exec((err, doc) => {
            if (err) {
                response.json({
                    status: '1',
                    msg: err.message
                })
            } else {
                if (doc) {
                    // 将objectid转换为Date对象
                    const dateToTime = function (id) {
                        return new Date(parseInt(id.toString().substring(0, 8), 16) * 1000)
                    }
                    doc.addressList.forEach(itemAdd => {
                        itemAdd.publishTimeNew = dateToTime(itemAdd._id)
                        // let _date = new Date(parseInt(itemAdd._id.toString().substring(0,8), 16)*1000)
                        // console.log(_date)
                    })
                    doc.addressList.sort(function (a, b) {
                        return b.publishTimeNew > a.publishTimeNew ? 1 : -1
                    })
                    response.json({
                        status: '0',
                        msg: '',
                        result: {
                            addresslist: doc.addressList
                        }
                    })
                }
            }
        })
        /*User.findOne({ '_id': userId }, (err, userDoc) => {
            if (err) {
                response.json({
                    status: '1',
                    msg: err.message
                })
            } else {
                if (userDoc) {
                    response.json({
                        status: '0',
                        msg: '',
                        result: {
                            addresslist: userDoc.addressList
                        }
                    })
                }
            }
        })*/
    } else {
        response.json({
            status: '1',
            msg: '未登录'
        })
    }
})

// 用户添加收货地址
router.post('/addAddress', function (request, response, next) {
    const userId = request.session.userId
    if (userId) {
        // 获取所有的参数
        let address = [
            // addressId: new ObjectID(),
            {
                username: request.body.userName,
                streetname: request.body.streetName,
                postcode: request.body.postCode,
                tel: request.body.phoneNumber,
                isDefault: request.body.isDefault
            }
        ]
        User.findOne({ '_id': userId }, (err, userDoc) => {
            if (err) {
                response.json({
                    status: '1',
                    msg: err.message
                })
            } else {
                if (userDoc) {
                    if (userDoc.addressList.length == 0) {
                        userDoc.addressList.push(address[0])
                        userDoc.save((err1, doc1) => {
                            if (err1) {
                                response.json({
                                    status: '1',
                                    msg: err1.message
                                })
                            } else {
                                response.json({
                                    status: '0',
                                    msg: '',
                                    result: 'success'
                                })
                            }
                        })
                    } else {
                        let addressFlag = null
                        userDoc.addressList.forEach(userItem => {
                            address.forEach(addItem => {
                                if (userItem.username != addItem.username || userItem.streetname != addItem.streetname || userItem.postcode != addItem.postcode || userItem.tel != addItem.tel) {
                                    // userDoc.addressList.push(addItem)
                                    addressFlag = addItem
                                } else {
                                    addressFlag = null
                                }
                            })
                        })
                        if (addressFlag) {
                            userDoc.addressList.push(addressFlag)
                            userDoc.save((err2, doc2) => {
                                if (err2) {
                                    response.json({
                                        status: '1',
                                        msg: err2.message
                                    })
                                } else {
                                    response.json({
                                        status: '0',
                                        msg: '',
                                        result: 'success'
                                    })
                                }
                            })
                        } else {
                            response.json({
                                status: '12',
                                msg: '重复地址',
                                result: ''
                            })
                        }
                    }
                }
            }
        })
    }
})

// 用户删除地址
router.post('/delAddressItem', function (request, response, next) {
    const userId = request.session.userId
    if (userId) {
        // 获取要删除的地址ID值
        let addressId = request.body.addressId
        User.update({ '_id': userId }, {
            $pull: {
                'addressList': {
                    '_id': addressId
                }
            }
        }, (err, doc) => {
            if (err) {
                response.json({
                    status: '1',
                    msg: err.message
                })
            } else {
                response.json({
                    status: '0',
                    msg: '',
                    result: 'success'
                })
            }
        })
    }
})

// 加载添加地址表单的设置默认地址是否可以点击
router.get('/loadSwitch', function (request, response, next) {
    const userId = request.session.userId
    if (userId) {
        User.findOne({ '_id': userId }, (err, userDoc) => {
            if (err) response.json({ status: '1', msg: err.message })
            if (userDoc) {
                let flag = ''
                // 处理没有地址的情况下
                if (userDoc.addressList.length > 0) {
                    userDoc.addressList.forEach(item => {
                        if (item.isDefault == true) {
                            flag = 'ok'
                        }
                    })
                    // 说明已经有默认的地址了
                    if (flag == 'ok') {
                        response.json({
                            status: '0',
                            msg: '',
                            result: 'yes'
                        })
                    } else {
                        response.json({
                            status: '00',
                            msg: '',
                            result: 'no'
                        })
                    }
                } else if (userDoc.addressList.length = 0) {
                    response.json({
                        status: '00',
                        msg: '',
                        result: 'no'
                    })
                }
            }
        })
    }
})

// 用户设置默认地址
router.post('/setDefaultAddress', function (request, response, next) {
    const userId = request.session.userId
    if (userId) {
        let addressId = request.body.addressId
        User.findOne({ '_id': userId }, (err, userDoc) => {
            if (err) response.json({ status: '1', msg: err.message })
            if (userDoc) {
                if (addressId) {
                    let flag = ''
                    userDoc.addressList.forEach(addItem => {
                        if (ObjectID(addItem._id).toString() == ObjectID(addressId).toString()) {
                            addItem.isDefault = true
                            flag = '1'
                        } else {
                            addItem.isDefault = false
                        }
                    })
                    if (flag == '1') {
                        userDoc.save((err2, doc2) => {
                            if (err2) response.json({ status: '1', msg: err2.message })
                            response.json({
                                status: '0',
                                msg: '',
                                result: 'success'
                            })
                        })

                    }
                }
            }
        })
    } else {
        response.json({
            status: '1',
            msg: '未登录'
        })
    }
})

// 用户创建订单
router.post('/parMent', function (request, response, next) {
    const userId = request.session.userId
    if (userId) {
        let addressId = request.body.addressId
        let orderTotal = request.body.orderTotal
        User.findOne({ '_id': userId }, (err, userDoc) => {
            if (err) response.json({ status: '1', msg: err.message })
            if (userDoc) {
                let addressInfo = {}, goodsList = []
                userDoc.addressList.forEach(userItem => {
                    if (ObjectID(userItem._id).toString() == ObjectID(addressId).toString()) {
                        addressInfo = userItem
                    }
                })
                userDoc.cartList.forEach(cartItem => {
                    if (cartItem.checked == '1') {
                        goodsList.push(cartItem)
                    }
                })
                // 对Date的扩展，将 Date 转化为指定格式的String
                // 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
                // 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
                Date.prototype.Format = function (fmt) { //author: meizz
                    var o = {
                        'M+': this.getMonth() + 1, //月份
                        'd+': this.getDate(), //日
                        'h+': this.getHours(), //小时
                        'm+': this.getMinutes(), //分
                        's+': this.getSeconds(), //秒
                        'q+': Math.floor((this.getMonth() + 3) / 3), //季度
                        'S': this.getMilliseconds() //毫秒
                    }
                    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
                    for (var k in o) {
                        if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
                    }
                    return fmt
                }
                // 定义订单创建时间
                let createDateTime = new Date().Format('yyyy-MM-dd hh:mm:ss')
                // 定义订单id
                // let orderId = Date.now()+uuid.v1()
                let orderId = mongoose.Types.ObjectId()
                // 定义订单对象
                let order = {
                    orderId: orderId,
                    orderTotal: orderTotal,
                    addressInfo: addressInfo,
                    goodsList: goodsList,
                    createDateTime: createDateTime,
                    orderStatus: '1'
                }
                userDoc.orderList.push(order)
                userDoc.save((err2, doc2) => {
                    if (err2) response.json({ status: '1', msg: err2.message })
                    // console.log(doc2)
                    response.json({
                        status: '0',
                        msg: '',
                        result: {
                            orderId: orderId,
                            orderTotal: orderTotal
                        }
                    })
                })
            }
        })
    }
})

// 用户设置性别,介绍
router.post('/savePersonInfo', function (request, response, next) {
    const userId = request.session.userId
    if (userId) {
        let userGender = request.body.userGender,
            userDesc = request.body.userDesc
        User.findOne({ '_id': userId }, (err, doc) => {
            if (err) response.json({ status: '1', msg: err.message })
            if (doc) {
                if (userGender){
                    doc.userGender = userGender
                    doc.userDesc = userDesc
                }
                doc.save((err2, doc2)=>{
                    if (err2)response.json({status: '1',msg: err2.message})
                    response.json({
                        status: '0',
                        msg: '',
                        result: {
                            userGender: doc2.userGender,
                            userDesc: doc2.userDesc
                        }
                    })
                })
            }
        })
    }
})
module.exports = router
