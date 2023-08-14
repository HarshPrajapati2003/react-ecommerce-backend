const express = require("express");
const server = express();
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const { createProduct } = require("./Controller/Product");
const productsRouters = require("./routes/Products");
const categoriesRouters = require("./routes/Categories");
const brandsRouters = require("./routes/Brands");
const usersRouters = require("./routes/Users");
const authRouters = require("./routes/Auth");
const cartRouters = require("./routes/Cart");
const orderRouter = require("./routes/Order");
const {User} = require("./model/User")

// middlewares

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
server.use("/products",isAuth, productsRouters.router);
server.use("/categories", categoriesRouters.router);
server.use("/brands", brandsRouters.router);
server.use("/users", usersRouters.router);
server.use("/auth", authRouters.router);
server.use("/cart", cartRouters.router);
server.use("/orders", orderRouter.router);

// Passport Strategies
passport.use(
  new LocalStrategy(async function (username, password, done) {
    // by default passport uses username
    try {
      const user = await User.findOne({ email: username });
      if (!user) {
        done(null, false, { message: "no email exist" });
      } else if (user.password === password) {
        done(null,user);       // this line sends to serializeUser function
      } else {
        done(null, false, { message: "invalid credential" });
      }
    } catch (err) {
      done(err);
    }
  })
);

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

server.get("/", (req, res) => {
  res.json({ status: "success" });
});

function isAuth(req,res,done){
    if(req.user){
        done()
    }else{
        res.sendStatus(401)
    }
}

server.post("/products", createProduct);

server.listen(8080, () => {
  console.log("server started");
});
