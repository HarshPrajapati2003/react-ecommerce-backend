const { User } = require("../model/User")

exports.createUser=async(req,res)=>{
    const user = new User(req.body)
    try {
        const doc = await user.save();
        res.status(201).json({id:doc.id,role:doc.role})
    } catch (err) {
        res.status(400).json(err.message)
    }
}

exports.loginUser=async(req,res)=>{
    try {
        const user = await User.findOne({email:req.body.email})
        // console.log(user)
        if(!user){
            res.status(401).json({message:"no email exist"})
        }
        else if(user.password===req.body.password){
            res.status(200).json({id:user.id,role:user.role})
        }else{
            res.status(401).json({message:"invalid credential"})
        }
    } catch (err) {
        res.status(400).json(err.message)
    }
}