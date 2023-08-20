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
  