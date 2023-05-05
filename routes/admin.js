const express = require('express');
const router = express.Router();
const adminControllers = require('../controllers/adminControllers');
const upload = require('../utils/multer');
const userControllers = require('../controllers/userControllers');
const verifySession = require('../middleware/verifySession');
//const adminHelpers=require('../helpers/adminhelpers')

// Admin Login & Logout
router.get('/', verifySession.ifAdminLoggedIn, adminControllers.adminLogin);

router.get('/AdminLogout', verifySession.verifyAdminLoggedIn, adminControllers.adminLogout);


// Admin Panel
router.get('/adminpanel', verifySession.verifyAdminLoggedIn, adminControllers.adminPanel);

router.post('/adminpanel', adminControllers.adminLoginPost);

// Admin Users
router.get('/adminUserManagement',  verifySession.verifyAdminLoggedIn, adminControllers.adminUserManagement);

// router.get('/addUser',  verifySession.verifyAdminLoggedIn, adminControllers.adminAddUser);

// router.post('/addUser', adminControllers.adminAddUserPost);

// router.post('/editUser/:id', adminControllers.adminEditUser);

router.get('/deleteUser/:id', adminControllers.adminDeleteUser);

router.get('/adminBlockUser/:id', adminControllers.adminBlockUser);
router.post('/suser',   adminControllers.adminsearchuser);


// Admin Products
router.get('/adminProduct', verifySession.verifyAdminLoggedIn, adminControllers.adminProduct);

router.get('/adminAddProduct', verifySession.verifyAdminLoggedIn, adminControllers.adminAddProduct);

router.post('/adminAddProduct',upload.array('image'), adminControllers.adminAddProductPost);

router.post('/adminEditProduct/:id',upload.array('image'), adminControllers.adminEditProduct);

router.get('/adminDeleteProduct/:id', adminControllers.adminDeleteProduct);

router.post('/adminSearchProduct', verifySession.verifyAdminLoggedIn, adminControllers.adminSearchProduct);


// Admin Category
router.get('/adminCategory', verifySession.verifyAdminLoggedIn, adminControllers.getCategory);

router.post('/adminCategory', adminControllers.addCategory);

router.get('/adminDeleteCategory/:id', adminControllers.deleteCategory);


// Admin Order
router.get('/adminOrder', verifySession.verifyAdminLoggedIn, adminControllers.adminOrder);

router.post('/adminOrderStatus/:id', verifySession.verifyAdminLoggedIn, adminControllers.adminOrderStatus);







module.exports = router;