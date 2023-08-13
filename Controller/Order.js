const {Order} = require("../model/Order")

exports.fetchOrdersByUser=async(req,res)=>{
    const {userId}=req.params
    try {
        const orders=await Order.find({user:userId})
        res.status(200).json(orders)
    } catch (err) {
        res.status(400).json(err)
    }
}

exports.createOrder=async(req,res)=>{
    const order = new Order(req.body)
    try {
        const doc = await order.save();
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