require('dotenv').config();
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
const path = require('path');
const { Order } = require('./model/Order');

// webhook (========> web hook requires express.raw parser formate so webhook put always top of the application <==========)

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.ENDPOINT_SECRET;

server.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  //to run this code in localhost you have to login by using strip login command and change the ENDPOINT_SECRET by sample endpoint which is provided in --> https://dashboard.stripe.com/test/webhooks/create?endpoint_location=local

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      console.log("payment Intent Succeeded : ",paymentIntentSucceeded)  

      const order = await Order.findById(paymentIntentSucceeded.metadata.orderId)
      order.paymentStatus="received"
      await order.save()
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

// JWT option

var opts = {}
opts.jwtFromRequest = cookieExtractor
opts.secretOrKey = process.env.JWT_SECRET_KEY;

// middlewares
server.use(express.static(path.resolve(__dirname,'build'))) 
server.use(cookieParser())
server.use(
  session({
    secret: process.env.SESSION_KEY,
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


// this line we add to make react router work in case of other routes doesn't match
server.get('*',(req,res)=>res.sendFile(path.resolve('build',"index.html")))
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
          const token = jwt.sign(sanitizeUser(user),process.env.JWT_SECRET_KEY)
          done(null,{id:user.id,role:user.role,token});       // this line sends to serializeUser function
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
          console.log("hello")
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

// Payment

// This is your test secret API key.
const stripe = require("stripe")(process.env.STRIPE_SERVER_KEY);

server.post("/create-payment-intent", async (req, res) => {
  const { totalAmount,orderId } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount*100, // *100 is for extends amount upto decimal 
    currency: "inr",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata:{
      orderId
    }
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});


main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("database connected");
}

server.get('/',(req,res)=>{
  res.send("this is server side......")
})

server.listen(process.env.PORT, () => {
  console.log("server started");
});
