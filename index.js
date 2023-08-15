const express = require("express");
const server = express();
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const jwt = require('jsonwebtoken')
const LocalStrategy = require("passport-local").Strategy;
const crypto = require('crypto');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const cookieParser = require('cookie-parser')

const { createProduct } = require("./Controller/Product");
const productsRouters = require("./routes/Products");
const categoriesRouters = require("./routes/Categories");
const brandsRouters = require("./routes/Brands");
const usersRouters = require("./routes/Users");
const authRouters = require("./routes/Auth");
const cartRouters = require("./routes/Cart");
const orderRouter = require("./routes/Order");
const {User} = require("./model/User");
const { isAuth, sanitizeUser, cookieExtractor } = require("./Services/common");

const SECRET_KEY = 'SECRET_KEY'

// JWT option

var opts = {}
opts.jwtFromRequest = cookieExtractor
opts.secretOrKey = 'SECRET_KEY';

// middlewares
server.use(express.static('build'))
server.use(cookieParser())
server.use(
  session({
    secret: "keyboard cat",
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
  })
);

server.use(passport.authenticate("session"));

server.use(
  cors({
    exposedHeaders: ["X-Total-Count"],
  })
);

server.use(express.json()); // to parse req.body
server.use("/products",isAuth(), productsRouters.router);
server.use("/categories",isAuth(), categoriesRouters.router);
server.use("/brands",isAuth(), brandsRouters.router);
server.use("/users",isAuth(), usersRouters.router);
server.use("/auth", authRouters.router);
server.use("/cart",isAuth(), cartRouters.router);
server.use("/orders",isAuth(), orderRouter.router);

// Passport local Strategies
passport.use('local',
  new LocalStrategy({usernameField:'email'},async function (email, password, done) {
    // by default passport uses username
    try {
      const user = await User.findOne({ email: email });
      if (!user) {
        return done(null, false, { message: "no email exist" });
      }
      crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256',async function(err, hashedPassword){
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            return done(null, false, { message: "invalid credential" });
          } 
          const token = jwt.sign(sanitizeUser(user),SECRET_KEY)
          done(null,{token});       // this line sends to serializeUser function
      })
      
    } catch (err) {
      done(err);
    }
  })
);

// Passport jwt Strategies
passport.use('jwt',new JwtStrategy(opts,async function(jwt_payload, done) {
    console.log({jwt_payload})
    try {
        const user = await User.findById(jwt_payload.id);
        if (user) {
            return done(null,sanitizeUser(user));   // this calls serializer
        }
        else {
            return done(null, false); 
        }
    } catch (err) {
        return done(err, false);
        
    }
    
}));

// this creates session variable req.user on being called from callbacks
passport.serializeUser(function (user, cb) {
    console.log("serialize ",user)
  process.nextTick(function () {
    return cb(null, {id:user.id,role:user.role}); // this line sends to deserializeUser function
  });
});

// this changes session variable req.user when called from authorized request
passport.deserializeUser(function (user, cb) {
    console.log("de-serialize ",user)
  process.nextTick(function () {
    return cb(null, user);
  });
});

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://localhost:27017/ecommerce");
  console.log("database connected");
}

// server.get("/", (req, res) => {
//   res.json({ status: "success" });
// });

// server.post("/products", createProduct);

server.listen(8080, () => {
  console.log("server started");
});
