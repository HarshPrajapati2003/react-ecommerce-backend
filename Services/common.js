const nodemailer = require('nodemailer')
const passport = require('passport')

exports.isAuth=(req,res,done)=>{
    return passport.authenticate('jwt')
}

exports.sanitizeUser=(user)=>{
    return {id:user.id,role:user.role}
}

exports.cookieExtractor = function(req) {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwt'];
    }
    // TODO : this is temporary token for testing without cookie
    // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZTBhNmI5MDNkZjkyMzdiZjhhYjRmMSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjkyNDQ0MzQ1fQ.NMWI3KRk2fU-B3aMf-WxXc9W_qUwzSq5j9tMRVsi3fI"
 
    return token;
  };

// Emails
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "hpd2683@gmail.com",
      pass: process.env.MAIL_PASSWORD,
    }, 
  });

exports.sendMail =async function({to,subject,text,html}){
    // send mail with define transport object
            let info = await transporter.sendMail({
        from: '"Shop Haven" <hpd2683@gmail.com>', // sender address
        to: to, // list of receivers
        subject,// Subject line
        text, // plain text body
        html, // html body
      });
}
  