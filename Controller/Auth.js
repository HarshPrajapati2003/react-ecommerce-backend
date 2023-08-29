const { sanitizeUser, sendMail } = require("../Services/common");
const { User } = require("../model/User");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

exports.createUser = async (req, res) => {
  try {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async function (err, hashedPassword) {
        const user = new User({ ...req.body, password: hashedPassword, salt });
        const doc = await user.save();

        req.login(sanitizeUser(doc), (err) => {
          //this also calls serializer and asdds to session
          if (err) {
            res.status(400).json(err.message);
          } else {
            const token = jwt.sign(sanitizeUser(doc), process.env.JWT_SECRET_KEY);
            res
              .cookie("jwt", token, {
                expires: new Date(Date.now() + 3600000),
                httpOnly: true,
              })
              .status(201)
              .json({id:doc.id,role:doc.role});
          }
        });
      }
    );
  } catch (err) {
    res.status(400).json(err.message);
  }
};

exports.loginUser = async (req, res) => {
  const user = req.user
  console.log("req.user",user)
  res
    .cookie("jwt",user.token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true,
    })
    .status(200)
    .json({id:user.id,role:user.role});
};

exports.logout = async (req, res) => {
  res
    .cookie("jwt",null, {
      expires: new Date(Date.now()),
      httpOnly: true, 
    })
    .sendStatus(200)   
};

exports.checkAuth = async (req, res) => {
    if(req.user){
        res.json(req.user);
    }else{
        res.sendStatus(401)
    }
  
};

exports.resetPassowrdRequest = async (req, res) => {
  const {email} = req.body
  const user = await User.findOne({email:email})
if(user){
  // generate token for varify the user
    const token = crypto.randomBytes(48).toString('hex')
    user.resetPasswordToken = token;
    await user.save()
    const resetPageLink = "http://localhost:3000/reset-password?token="+token+'&email='+email
    const subject = "reset password for Shop Haven website"
    const html = `<p>Click <a href=${resetPageLink} >here</a> to reset password</p>`
    if(email){
      const response = await sendMail({to:email,subject,html})
      res.status(200).send(response) 
    }else{
      res.sendStatus(400)
    }
}else{
  res.sendStatus(400)
}
};

exports.resetPassowrd = async (req, res) => {
  const {email,password,token} = req.body
  const user = await User.findOne({email:email,resetPasswordToken:token})
if(user){
  const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async function (err, hashedPassword) {
        user.password = hashedPassword
        user.salt=salt
        await user.save()
        const subject = "password reset Successfully for Shop Haven website"
        const html = `<p>password reset Successfully for Shop Haven website</p>`
        if(email){
          const response = await sendMail({to:email,subject,html})
          res.send(response)
        }else{
          res.sendStatus(400)
        }
      })
}else{
  res.sendStatus(400)
}
};

