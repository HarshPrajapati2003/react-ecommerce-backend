const { sendMail, invoiceTemplate } = require("../Services/common")
const {Order} = require("../model/Order")
const { Product } = require("../model/Product")
const { User } = require("../model/User")

exports.fetchOrdersByUser=async(req,res)=>{
    const {id}=req.user
    try {
        const orders=await Order.find({user:id})
        res.status(200).json(orders)
    } catch (err) {
        res.status(400).json(err)
    }
}

exports.createOrder=async(req,res)=>{
    const order = new Order(req.body)
    // Here we have to update stocks
    for(let item of order.items){
        let product = await Product.findOne({_id:item.product.id})
        product.$inc('stock',-1*item.quantity)
        await product.save()
    }
    try {
        const doc = await order.save();
        const user = await User.findById(order.user)
        sendMail({to:user.email,html:invoiceTemplate(order),subject:'Order Received'})
        res.status(201).json(doc)
    } catch (err) {
        res.status(400).json(err.message)
    }
}

exports.deleteOrder=async(req,res)=>{
    const {id} = req.params
    try {
        const order = await Order.findByIdAndDelete(id)
        res.status(200).json(order)
    } catch (err) {
        res.status(400).json(err.message)
    }
}

exports.updateOrder=async(req,res)=>{
    const {id} = req.params
    try {
        const order = await Order.findByIdAndUpdate(id,req.body,{new:true});
        res.status(200).json(order)
    } catch (err) {
        res.status(400).json(err.message)
    }
}

exports.fetchAllOrders=async(req,res)=>{
    let query = Order.find({deleted:{$ne:true}})
    let totalOrdersQuery = Order.find({deleted:{$ne:true}})
  
    if(req.query._sort && req.query._order){
        query = query.sort({[req.query._sort]:req.query._order})
    }
    if(req.query._page && req.query._limit){
        const pageSize = req.query._limit
        const page = req.query._page
        query=query.skip(pageSize*(page-1)).limit(pageSize)
    }
   
    const totalDocs = await totalOrdersQuery.count().exec()
    // console.log({totalDocs})

    try {
        const docs = await query.exec()

        //---> res.set must write before res.status(---).json({})  <----
        res.set('X-Total-Count',totalDocs)    //res.set is use to set a header in api 
        res.status(201).json(docs)
    } catch (err) {
        res.status(400).json(err.message)
    }
}