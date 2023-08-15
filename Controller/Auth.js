const { sanitizeUser } = require("../Services/common");
const { User } = require("../model/User");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "SECRET_KEY";

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
            const token = jwt.sign(sanitizeUser(doc), SECRET_KEY);
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
  res
    .cookie("jwt", req.user.token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true,
    })
    .status(200)
    .json(req.user.token);
};

exports.checkAuth = async (req, res) => {
    if(req.user){
        res.status(200).json(req.user);
    }else{
        res.sendStatus(401)
    }
  
};
