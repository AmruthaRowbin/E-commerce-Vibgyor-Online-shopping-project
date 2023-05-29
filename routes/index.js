


const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/userControllers');
const verifySession = require('../middleware/verifySession');
const userHelpers = require('../helpers/userhelpers');
const multer = require('../utils/multer');

 
// User Home, Login, Signup





router.get('/', verifySession.verifyUserLoggedIn,userControllers.userHome);

router.post('/Home', userControllers.userLoginPost);

router.get('/login', userControllers.userLogin);

router.get('/logout',verifySession.verifyUserLoggedIn, userControllers.logout);

router.get('/signup',verifySession.ifUserLoggedIn, userControllers.signUp);

router.get('/signup', userControllers.userSignup);

router.post('/signup', userControllers.signUpPost);

router.get('/forgotPass',userControllers.forgotPass)

router.post ('/forgotPasswordPost',userControllers.forgotPasswordPost)

router.post('/forgotPassOTP',userControllers.forgotPassOtpVerificaion)


// otp
router.get('/otpverification',verifySession.ifUserLoggedIn, userControllers.otpPageRender);

router.post('/otpverification', userControllers.otpVerification);

router.get('/forgotPassOtp',userControllers.forgotPassPageRender);

router.post('/forgotPassOtpVerificaion',verifySession.ifUserLoggedIn,userControllers.forgotPassOtpVerificaion)


// User Panel shop page

router.get('/shop',verifySession.verifyUserLoggedIn, userControllers.userStatus,userControllers.shopPage);

router.get('/product/:id',verifySession.verifyUserLoggedIn, userControllers.productPage);

 router.get('/category/:name', verifySession.verifyUserLoggedIn, userControllers.categoryFilter);



// User Cart
router.get('/cart/',verifySession.verifyUserLoggedIn,userControllers.userStatus, userControllers.cart);



router.get('/addToCart/:id', verifySession.verifyUserLoggedIn, userControllers.cartPage);

router.get('/deleteCart/:id', verifySession.verifyUserLoggedIn, userControllers.deleteCart);

 router.post('/change-product-quantity', verifySession.verifyUserLoggedIn, userControllers.changeProductQuantity);

//User checkout

router.get('/checkOut',verifySession.verifyUserLoggedIn, userControllers.checkOutPage);

router.get('/checkOut',verifySession.verifyUserLoggedIn, userControllers.checkOutPage);

router.post('/checkOutPost', verifySession.verifyUserLoggedIn, userControllers.checkOutPost);

router.post('/editAddressPost/:id', verifySession.verifyUserLoggedIn, userControllers.editAddressPost);

router.get('/deleteAddress/:id' , verifySession.verifyUserLoggedIn, userControllers.deleteAddress);

router.post('/placeOrder', verifySession.verifyUserLoggedIn, userControllers.placeOrder);

router.post('/verifyPayment', verifySession.verifyUserLoggedIn, userControllers.verifyPayment);

router.get('/success', verifySession.verifyUserLoggedIn, userControllers.paypalSuccess);

router.get('/cancel', verifySession.verifyUserLoggedIn, userControllers.failure);





// User  Orders
router.get('/orders', verifySession.verifyUserLoggedIn,userControllers.userStatus, userControllers.orders);

router.get('/orders/viewProduct/:id', verifySession.verifyUserLoggedIn, userControllers.viewDet);


router.post('/setinvoice/:id',verifySession.verifyUserLoggedIn,userControllers.invoicegenerator)


router.post('/cancelOrder/:id', verifySession.verifyUserLoggedIn, userControllers.cancelOrder);

router.post('/returnOrder/:id', verifySession.verifyUserLoggedIn, userControllers.returnOrder);


//UserProfile
router.get('/userProfile', verifySession.verifyUserLoggedIn, userControllers.userStatus,userControllers.userProfile);

router.post('/userProfilePost', verifySession.verifyUserLoggedIn, userControllers.userProfilePost);

router.get('/userManageAddress', verifySession.verifyUserLoggedIn, userControllers.manageAddress);

router.get('/wallet', verifySession.verifyUserLoggedIn, userControllers.getWallet);

router.post('/uploadProfileImage', multer.single('file'), userControllers.profileImage);

//Wishlist
router.get('/wishlist', verifySession.verifyUserLoggedIn, userControllers.userStatus,userControllers.wishlist);

router.get('/addToWishlist/:id', verifySession.verifyUserLoggedIn, userControllers.wishlistPage);

router.get('/deleteWishlist/:id', verifySession.verifyUserLoggedIn, userControllers.deleteWishlist);




//Filter

//Filter
router.post('/shopPriceFilter', verifySession.verifyUserLoggedIn, userControllers.priceFilter);

router.post('/shopPriceSort', verifySession.verifyUserLoggedIn, userControllers.sortPrice);

router.post('/user/userSearchProduct', verifySession.verifyUserLoggedIn, userControllers.userSearchProduct);


router.post('/couponApply', verifySession.verifyUserLoggedIn, userControllers.couponApply);





module.exports = router;