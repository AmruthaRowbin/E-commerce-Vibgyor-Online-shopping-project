const adminHelpers = require('../helpers/adminhelpers');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/userhelpers');
const categoryHelpers = require('../helpers/categoryhelpers');
const cloudinary =  require('../utils/cloudinary');
 module.exports = {
    

// Admin Login & Logout
    adminLogin: (req, res) => {
        if(req.session.adminLoggedIn){
            res.redirect('/adminpanel')
        }else{
            const adminName = req.session.adminName;
            res.render('admin/login', {admin: true, passErr:req.session.passErr, emailErr:req.session.emailErr, adminName});
            req.session.passErr = false;
            req.session.emailErr = false;
        }
    },

    adminLoginPost: (req, res) => {
        adminHelpers.doAdminLogin(req.body).then((response) => {
            if(response.status == "Invalid password"){
                req.session.passErr = response.status;
                res.redirect('/admin');
            }else if(response.status == "Invalid user"){
                req.session.emailErr = response.status;
                res.redirect('/admin');
            }else{
                req.session.admin = response.admin;
                req.session.adminName = req.session.admin.email;
                req.session.adminLoggedIn = true;
                res.render('admin/adminpanel', {admin: true, adminName: req.session.adminName});
            }
        })
    },

    adminLogout: (req, res) => {
        req.session.adminLoggedIn = false;
        req.session.adminName = false;
        res.redirect('/admin');
    },


 //Admin Panel
    adminPanel: (req, res) => {
        res.render('admin/adminpanel', {admin: true, adminName: req.session.adminName});
    },


    //Admin User CRUD
    adminUserManagement: async (req, res) => {
        const adminName = req.session.adminName;
        const userData = await adminHelpers.getUser();
        res.render('admin/adminUserManagement', {admin: true, adminName, userData});
},

// adminAddUser: (req, res) => {
//     const adminName = req.session.adminName;
//     res.render('admin/addUser', {admin: true, adminName})
// },

// adminAddUserPost: (req, res) => {
//     userHelpers.doSignUp(req.body).then((response) => {
//         if(response == "Email already exist!!!"){
//             req.session.emailExist = response;
//             res.redirect('back');
//         }else{
//             res.redirect('back');
//         }
//     }).catch((err) => {
//         console.log(err);
//     })
// },

// adminEditUser: (req, res) => {
//         const userId  = req.params.id;
//         adminHelpers.editUser(userId, req.body).then(() => {
//             res.redirect('/admin/adminUserManagement');
//         }).catch((err) => {
//             console.log(err);
//         })
// },

adminDeleteUser: (req, res) => {
        const userId = req.params.id;
        adminHelpers.deletUser(userId).then(() => {
            res.redirect('/admin/adminUserManagement')
        }).catch((err) => {
            console.log(err); 
        })
},

// adminDeleteUser: (req, res) => {
//     const userId = req.params.id;
//     adminHelpers.deletUser(userId).then((message) => {
//         res.redirect('/admin/adminUserManagement?success=' + encodeURIComponent(message));
//     }).catch((err) => {
//         console.log(err); 
//     })
// },

adminBlockUser: (req, res) => {
        const userId = req.params.id;
        console.log(userId);
        adminHelpers.blockUser(userId).then(() => {
            res.redirect('/admin/adminUserManagement')
        }).catch((err) => {
            console.log(err);
        })
},
adminsearchuser:(req,res)=>{
    const userId=req.params.id;
    adminHelpers.suser(userId).then(()=>{
        res.redirect('/admin/adminUserManagement')
    }).catch((err)=>{
        console.log(err)
    })
},



adminSearchProduct: async (req, res) => {
    const adminName = req.session.adminName;
    // console.log(req.body.name+"weweweweew");
    const product = await adminHelpers.adminSearchProduct(req.body.name);
    // console.log(product+"qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
    res.render('admin/adminProduct', {admin: true, adminName, product})
},


//Admin Product CRUD
adminProduct: async (req, res) => {
    const adminName = req.session.adminName;
    const productData = await productHelpers.getProducts();
    res.render('admin/adminProduct', {admin: true, adminName, productData});
},

adminAddProduct: (req, res) => {
    const adminName = req.session.adminName;
    categoryHelpers.getCategory().then((category) => {
        console.log(category);
        //res.render('admin/adminCategory', {admin: true, adminName, category})
        res.render('admin/adminAddProduct', {admin: true, adminName, category});
    });
    
},

adminAddProductPost: (req, res) => {
    productHelpers.addProducts(req.body).then(async(id)=>{
        const imgUrls = [];
        try{
            for(let i=0;i<req.files.length;i++){
                const result = await cloudinary.uploader.upload(req.files[i].path);
                imgUrls.push(result.url);
            }
            console.log(imgUrls)
            productHelpers.addProductImage(id, imgUrls).then(()=>{}).catch(()=>{});
        }catch(err){
            console.log(`error : ${err}`);
        }finally{
            res.redirect('/admin/adminAddProduct');
        }
    });
},

adminEditProduct: (req, res) => {
        const productId = req.params.id;
        console.log(productId);
        productHelpers.editProduct(productId, req.body).then(async()=>{
            const imgUrls = [];
            try{
                for(let i=0;i<req.files.length;i++){
                    const result = await cloudinary.uploader.upload(req.files[i].path);
                    imgUrls.push(result.url);
                }
                console.log(imgUrls);
                productHelpers.editProductImage(productId, imgUrls).then(()=>{}).catch(()=>{});
            }catch(err){
                console.log(`error : ${err}`);
            }finally{
                res.redirect('/admin/adminProduct');
            }
        })
},

adminDeleteProduct: (req, res) => {
    const productId = req.params.id;
    productHelpers.deleteProducts(productId).then(() => {
        res.redirect('/admin/adminProduct')
    }).catch((err) => {
        console.log(err);
    })
},
// Admin Category Management
getCategory:(req, res) => {
    const adminName = req.session.adminName;
    categoryHelpers.getCategory().then((category) => {
        res.render('admin/adminCategory', {admin: true, adminName, category})
    });
},

addCategory:(req, res) => {
    categoryHelpers.addCategory(req.body).then(async(id) => {
        res.redirect('/admin/adminCategory');
    })
},




deleteCategory: (req, res) => {
    const category = req.params.id;
    console.log(category);
    categoryHelpers.deleteCategory(category).then(() => {
        res.redirect('/admin/adminCategory');
    }).catch((err) => {
        console.log(err);
    })
},



// Orders
adminOrder: (req, res) => {
    const adminName = req.session.adminName;
    adminHelpers.getUserOrder().then((adminOrder)=>{
        // console.log("api call");
        console.log(adminOrder);
        res.render('admin/adminOrder', {admin: true, adminName, adminOrder});
    })
},

adminOrderStatus:(req, res) => {
   const orderId = req.params.id;
//    const userId = req.body.userId;
   const status = req.body.status;
   console.log(req.body);
   
   adminHelpers.adminOrderStatus(orderId, status).then(() => {
    res.redirect('back');
   })
},



}