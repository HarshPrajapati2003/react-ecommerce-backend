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
    const resetPageLink = "https://react-ecommerce-backend-zeta.vercel.app/reset-password?token="+token+'&email='+email
    const subject = "reset password for Shop Haven website"
    const html = `
    <!doctype html>
    <html lang="en-US">
    
    <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <title>Reset Password Email Template</title>
        <meta name="description" content="Reset Password Email Template.">
        <style type="text/css">
            a:hover {text-decoration: underline !important;}
        </style>
    </head>
    
    <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
        <!--100% body table-->
        <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
            style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
            <tr>
                <td>
                    <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                        align="center" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="height:80px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align:center;">
                              <a href="https://react-ecommerce-backend-zeta.vercel.app" title="logo" target="_blank">
                                <h2 style="color:#4f46e5">Shop Haven</h2>
                              </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="height:20px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td>
                                <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                    style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 35px;">
                                            <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have
                                                requested to reset your password</h1>
                                            <span
                                                style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                            <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                We cannot simply send you your old password. A unique link to reset your
                                                password has been generated for you. To reset your password, click the
                                                following link and follow the instructions.
                                            </p>
                                            <a href=${resetPageLink}
                                                style="background:#4f46e5;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset
                                                Password</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                </table>
                            </td>
                        <tr>
                            <td style="height:20px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align:center;">
                                <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong>www.shophaven.com</strong></p>
                            </td>
                        </tr>
                        <tr>
                            <td style="height:80px;">&nbsp;</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <!--/100% body table-->
    </body>
    
    </html>`
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

