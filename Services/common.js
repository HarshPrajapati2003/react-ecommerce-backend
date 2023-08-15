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
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZGI2YmQyMTRhMWM3MzVlZmVmZmYwNCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjkyMTAxNjc5fQ.3UpdAZuG23aWOM9Z4nae9Vwl_FGvm7iQOA0TWUBAwNg"
    
    return token;
  };
  