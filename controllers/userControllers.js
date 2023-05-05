const categoryHelpers = require("../helpers/categoryhelpers");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/userhelpers");
const cartHelpers = require("../helpers/cartHelpers");
const { ObjectId } = require("mongodb")
const adminHelpers = require("../helpers/adminhelpers");


// Twilio-config
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;

const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID
const client = require("twilio")(accountSid, authToken);






module.exports = {

  //User Home 
  userHome: (req, res) => {
    productHelpers.getProducts().then((products) => {
      res.render("index", { user: true, userName: req.session.userName, products });
    })
  },


  //User Login & Logout 
  userLogin: (req, res) => {
    if (req.session.userLoggedIn) {
      res.redirect("/");
    } else {
      const userName = req.session.userName;
      res.render("user/login", { user: true, userName, passErr: req.session.passErr, emailErr: req.session.emailErr });
      req.session.passErr = false;
      req.session.emailErr = false;
    }
  },

  userSignup: (req, res) => {
    if (req.session.userLoggedIn) {
      res.redirect("/");
    } else {
      const userName = req.session.userName;
      res.render("user/signup", { user: true, userName, passErr: req.session.passErr, emailErr: req.session.emailErr });
      req.session.passErr = false;
      req.session.emailErr = false;
    }
  },

  //forgotpassword

  forgotPassPageRender: (req, res) => {
    res.render('user/forgotPassOtp', { user: true });
  },

  forgotPass: (req, res) => {
    if (req.session.userLoggedIn) {
      res.redirect("/");
    }
    else {
      const userName = req.session.userName;
      res.render("user/forgotPass", { user: true, userName, passErr: req.session.passErr, emailErr: req.session.emailErr });
      req.session.passErr = false;
      req.session.emailErr = false;
    }
  },




  forgotPasswordPost: (req, res) => {
    // Check if the password and rePassword fields match

    if (req.body.password !== req.body.confirmPass) {

      res.render("user/forgotPass", { errMsg: "Password does not match" });
      return;
    }


    delete req.body.confirmPass;

    // Remove the rePassword field from the request body


    // Validate the password using regular expressions
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

    if (!passwordRegex.test(req.body.password)) {

      res.render("user/forgotPass", { user: true, errMsg: "Password must contain 8 characters, uppercase, lowercase, number, and special(!@#$%^&*)" });
      //res.render('index',{user:true,userName:true});
      return;
    }




    userHelpers.checkuserBlockExist(req.body.email).then((response) => {

      if (response.status == "No user Found") {
        res.render("user/signup", { errMsg: response.status });
      } else if (response.status == "User Blocked") {

        res.render("user/forgotPass", { user: true, errMsg: response.status });
      }
      else {
        console.log("phonechecked");
        client.verify.v2
          .services(serviceSid)
          .verifications.create({ to: "+91" + response.phone, channel: "sms" })
          .then(() => {
            req.session.phone = response.phone;
            req.session.userDetails = req.body;
            res.redirect("/forgotPassOtp");
          }).catch((err) => console.log(err));

      }
    });
  },


  forgotPassOtpVerificaion: (req, res) => {
    const userOtp = req.body.otp;
    const phone = req.session.phone;
    console.log(userOtp, phone, req.session.userDetails);
    // otp verify
    client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: "+91" + phone, code: userOtp })
      .then((verification_check) => {
        if (verification_check.status === "approved") {
          // If the OTP is approved,Call the userSignup method to create the user
          userHelpers.forgotPassUpdatePass(req.session.userDetails)
            .then(() => {
              res.redirect('/login')
            })
            .catch((err) => {
              console.log(err);
            });
        } else {
          // If the OTP is not approved, render the OTP verification page with an error message
          res.render("user/forgotPassOtp", { errMsg: "Invalid OTP" });
        }
      })
      .catch((error) => {
        // Render the OTP verification page with an error message
        res.render("user/forgotPassOtp", {
          errMsg: "Something went wrong. Please try again.",
        });
      });
  },


  // ====================forgotEnd=========================








  userLoginPost: (req, res) => {
    userHelpers.doLogin(req.body).then((response) => {
      if (response.status === "Invalid Password") {
        req.session.passErr = response.status;
        res.redirect("/login");
      } else if (response.status === "Invalid User") {
        req.session.emailErr = response.status;
        res.redirect("/login");

      } else if (response.status === "User Blocked!!!") {
        req.session.passErr = response.status;
        res.redirect("/login");
      } else {
        req.session.user = response.user;
        req.session.userName = req.session.user.name;
        req.session.userLoggedIn = true;
        res.render("index", { user: true, userName: req.session.userName });
      }
    }).catch((err) => {
      console.log(err);
    });
  },

  logout: (req, res) => {
    req.session.userLoggedIn = false;
    req.session.userName = false;
    res.redirect("/");
  },


  //User Signup
  signUp: (req, res) => {
    res.render("user/signup", { user: true });
    req.session.emailExist = false;
  },

  signUpPost: (req, res) => {

    // Password check
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(req.body.password)) {
      res.render("user/signup", { user: true, errMsg: "Password must contain 8 characters, uppercase, lowercase, number, and special(!@#$%^&*)" });
      //res.render('index',{user:true,userName:true});
      return;
    }

    // Validate the mobile number using regular expressions
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(req.body.phone)) {
      res.render("user/signup", { user: true, errmsg: "Mobile number should be 10 digit number", });
      return;
    }

    // Redirect to otp page
    const phone = req.body.phone;
    client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: "+91" + phone, channel: "sms" })
      .then(() => {
        req.session.userDetailes = req.body;
        res.redirect('/otpverification')
      }).catch((err) => console.log(err));
  },



  //Otp Page Render and Verfication
  otpPageRender: (req, res) => {
    res.render('user/otpVerify', { user: true });
  },

  otpVerification: (req, res) => {
    const otp = req.body.otp;
    const phone = req.session.userDetailes.phone;
    console.log(req.body);
    client.verify
      .v2.services(serviceSid)
      .verificationChecks.create({ to: '+91' + phone, code: otp })
      .then((verification_check) => {
        if (verification_check.status === 'approved') {

          // If the OTP is approved,Call the userSignup method to create the user
          userHelpers.doSignUp(req.session.userDetailes).then((response) => {
            if (response == "Email already exist!!!") {
              req.session.emailExist = response;
              res.render("user/signup", { user: true, emailExist: req.session.emailExist });
            } else {
              req.session.user = response.user;
              req.session.userName = req.session.user.name;
              req.session.userLoggedIn = true;
              res.render("index", { user: true, userName: req.session.userName });
            }
          }).catch((err) => {
            console.log(err);
          });
        } else {
          // If the OTP is not approved, render the OTP verification page with an error message
          res.render('user/otpVerify', { user: true, errMsg: 'Invalid OTP' });
        }
      })
      .catch((error) => {
        console.log(error);
        // Render the OTP verification page with an error message
        res.render('user/otpVerify', { user: true, errMsg: 'Something went wrong. Please try again.' });
      });
  },









  //User Product Page  

  productPage: (req, res) => {
    const productData = req.params.id;
    const userName = req.session.userName;
    productHelpers.getSingleProduct(productData)
      .then((product) => {
        if (!product) {
          res.render("user/productNotFound", { user: true, userName });
        }
        else {
          res.render("user/productPages", { user: true, userName, product });
        }
      })
      .catch((err) => {
        console.log(err);
      })
  },


  //User Shop page
  shopPage: async (req, res) => {
    const userName = req.session.userName;
    const categories = await productHelpers.getListedCategory();
    productHelpers.getProducts().then((products) => {
      res.render("user/shop", { user: true, categories, userName, products });
    }).catch((err) => {
      // res.render("users/shop", { user: true, userName });

      res.status(404).render("user/productNotFound", { user: true, userName });
      console.log(err);

    });
  },



  //User Cart Page
  cart: async (req, res) => {
    const userName = req.session.user.name;
    const userId = req.session.user._id;
    const userDetailes = await cartHelpers.getCart(userId);
    if (!userDetailes.length == 0) {
      await cartHelpers.getCartTotal(req.session.user._id).then((total) => {
        res.render("user/cart", { user: true, userName, userDetailes, total: total });
      })
    } else {
      res.render('user/cart', { user: true, userName });
    }
  },


  cartPage: async (req, res) => {
    const productId = req.params.id;
    let quantity = 1;
    await cartHelpers.addToCart(productId, req.session.user._id, quantity);
    res.json({
      status: "success",
      message: "added to cart"
    })
  },

  deleteCart: (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.id;
    cartHelpers.deleteCart(productId, userId).then(() => {
      res.redirect('back');
    })
  },




  // Category Filter
  categoryFilter: async (req, res) => {
    const userName = req.session.userName;
    const catName = req.params.name;
    const categories = await productHelpers.getListedCategory();
    try {
      categoryHelpers.getSelectedCategory(catName)
        .then((products) => {
          res.render("user/shop", { user: true, categories, userName, products });
        })
        .catch(() => {
          res.redirect('/shop');
        })
    } catch (err) {
      res.redirect('/shop');
    }
  },


  // User Checkout Page
  checkOutPage: async (req, res) => {
    const userName = req.session.user.name;
    const addresses = await userHelpers.getAddress(req.session.user._id);
    await cartHelpers.getCartTotal(req.session.user._id).then((total) => {
      res.render("user/checkOut", { user: true, userName, addresses, total });
    }).catch((err) => {
      console.log(err);
    })
  },

  checkOutPost: (req, res) => {
    userHelpers.addAddress(req.body, req.session.user._id);
    res.redirect('back');
  },

  placeOrder: async (req, res) => {
    const addressId = req.body.address
    const total = await cartHelpers.getCartTotal(req.session.user._id);
    // console.log(total+"//////////////////////////"); 
    const paymentMethod = req.body.paymentMethod
    // console.log(`addressid : 324245 ${addressId}`);
    // console.log(`userID : 0987656789 ${req.session.user._id}`);
    const shippingAddress = await userHelpers.findAddress(addressId, req.session.user._id)
    const cartItems = await cartHelpers.getCart(req.session.user._id)
    const order = {
      userId: new ObjectId(req.session.user._id),
      userName: req.session.userName,
      item: cartItems,
      shippingAddress: shippingAddress,
      total: total,
      paymentMethod: paymentMethod,
      products: cartItems,
      date: new Date().toISOString().slice(0, 19),
      status: "placed"
    }

    userHelpers.addOrderDetails(order)
      .then(async () => {
        await cartHelpers.deleteCartFull(req.session.user._id);
      })
      .catch((err) => {
        console.log(err);
      });

    res.json({
      status: true
    })
  },

  editAddressPost: (req, res) => {
    const address = req.params.id;
    userHelpers.editAddress(req.body, req.session.user._id, address);
    res.redirect('back')
  },

  deleteAddress: (req, res) => {
    const addressId = req.params.id;
    userHelpers.deleteAddress(addressId, req.session.user._id);
    res.redirect('back');
  },


  // Product Quantity
  changeProductQuantity: (req, res, next) => {
    cartHelpers.changeProductQuantity(req.session.user._id, req.body)
      .then(async (response) => {
        if (!response.removeProduct) {
          response.total = await cartHelpers.getCartTotal(req.session.user._id)
          res.json(response)
        } else {
          res.json(response)
        }
      })
  },


  // Orders Page
  orders: async (req, res) => {
    const userName = req.session.userName;
    const userId = req.session.user._id;
    const orders = await userHelpers.getOrders(userId);
    // console.log(JSON.stringify(orders)+"aaaaaaaaaaaaaaaaaaaaaaaaa");
    res.render('user/orders', { user: true, userName, orders });
  },


  viewDet: async (req, res) => {
    const userName = req.session.userName;
    const orderId = req.params.id;
    const orders = await userHelpers.getOrderedProducts(orderId);
    console.log(orders + "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    res.render('user/viewDet', { user: true, userName, orders })
  },

  cancelOrder: (req, res) => {
    const orderId = req.params.id
    userHelpers.cancelOrder(orderId).then(() => {
      res.redirect('back')
    })
  },

// User Profile
userProfile: async (req, res) => {
  const userName = req.session.userName;
  const address = await userHelpers.getAddress(req.session.user._id);
  // console.log(address+"wooooooooooooooooooooooooooooooow");
  res.render('user/userprofile', {user: true, userName, userDetailes:req.session.user, address});
},

userProfilePost: (req, res) => {
  const userId = req.session.user._id;
  userHelpers.editProfile(userId, req.body).then(() => {
    if (req.body.oldPassword.length > 1) {
      userHelpers.editPassword(userId, req.body).then((response) => {
        if (response) {
          req.session.changePassword = "";
          res.redirect('/userprofile');
        } else {
          req.session.changePassword = "Invalid old password";
          res.redirect('/userprofile');
        }
      }).catch((error) => {
        console.log(error);
        req.session.changePassword = "An error occurred while changing the password";
        res.redirect('/userprofile');
      });
    } else {
      req.session.changePassword = "";
      res.redirect('/userprofile');
    }
  });
},




manageAddress: async(req, res) => {
  const userName = req.session.userName;
  const addresses = await userHelpers.getAddress(req.session.user._id);
  res.render('user/manageAddress', {user: true, userName, addresses})
},



}
