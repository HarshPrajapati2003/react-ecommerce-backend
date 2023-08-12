const express = require('express')
const server = express()
const mongoose = require('mongoose')
const { createProduct } = require('./Controller/Product')
const productsRouters = require("./routes/Products")
const categoriesRouters = require("./routes/Categories")
const brandsRouters = require("./routes/Brands")
const cors = require('cors')

server.use(cors({
    exposedHeaders:['X-Total-Count']
}))
server.use(express.json()) // to parse req.body
server.use('/products',productsRouters.router)
server.use('/categories',categoriesRouters.router)
server.use('/brands',brandsRouters.router)

main().catch(err=>console.log(err))

async function main(){
    await mongoose.connect('mongodb://localhost:27017/ecommerce')
    console.log("database connected")
}

server.get("/",(req,res)=>{
    res.json({status:"success"})
})

server.post("/products",createProduct)

server.listen(8080,()=>{
    console.log("server started")
})
