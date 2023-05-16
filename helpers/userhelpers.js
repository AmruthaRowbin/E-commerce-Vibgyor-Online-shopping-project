const db = require('../config/connection');
const collection = require('../config/collection');
const bcrypt = require('bcrypt');
const objectId = require('mongodb-legacy').ObjectId
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { json } = require('body-parser');





//var razorpay_key_id = "rzp_test_FyWlYra71TAw6C"
//var razorpay_key_secret = "ieGubz9JCjCmkvhbL8t8npxk"

var instance = new Razorpay({
  key_id: 'rzp_test_xMMpExEP8RJtcM',
  key_secret: 'PgpfiQkJrfxLJnGVdHozQYeU'
  ,
})

module.exports = {

  // User Signup & Login
  // doSignUp: (userData) => {
  //     return new Promise(async (resolve, reject) => {
  //         const findUserExist = await db.get().collection(collection.USER_COLLECTION).findOne({email: userData.email});
  //         if(!findUserExist || userData.email !== findUserExist.email){
  //             Object.assign(userData, {status: true});
  //             userData.password = await bcrypt.hash(userData.password, 10);
  //         db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((response) => {
  //             console.log(response);
  //             resolve(response);
  //         }).catch((err) => {
  //             console.log(err);
  //             reject(err);
  //         })
  //         }else{
  //             resolve("Email already exist!!!");
  //         }

  //     })
  // },

  doSignUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      const findUserExist = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email });
      if (!findUserExist || userData.email !== findUserExist.email) {
        Object.assign(userData, { status: true });
        userData.password = await bcrypt.hash(userData.password, 10);
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((status) => {
          if (status) {
            resolve({ user: userData });
          }
        }).catch((err) => {
          console.log(err);
          reject(err);
        });
      } else {
        console.log("email checked");
        resolve("Email already exists!!!");
      }
    });
  },

  //   ===========forgotPass===============
  checkuserBlockExist: (email) => {
    let response = {}
    return new Promise(async (resolve, reject) => {
      const user = await db.get().collection(collection.USER_COLLECTION)
        .findOne({ email: email })
      if (user) {
        if (user.status == false) {
          response.status = "User Blocked";
          resolve(response);
        }
        console.log("insidephone");
        response.phone = user.phone

        resolve(response)
      } else {
        response.status = 'No user Found'
        resolve(response)
      }
    })
  },
  forgotPassUpdatePass: (userDetails) => {
    return new Promise(async (resolve, reject) => {
      userDetails.password = await bcrypt.hash(userDetails.password, 10);
      db.get().collection(collection.USER_COLLECTION)
        .updateOne(
          { email: userDetails.email },
          {
            $set: {
              password: userDetails.password
            }
          })
        .then(() => { resolve() })
        .catch(() => { reject() })
    })
  },
  //   ====================forgotEnd=========================








  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      const response = {};
      const user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            if (user.status == true) {
              response.user = user;
              resolve(response);
            } else {
              response.status = "User Blocked!!!";
              resolve(response);
            }
          } else {
            response.status = "Invalid Password";
            resolve(response);
          }
        }).catch((err) => {
          console.log(err);
        });
      } else {
        response.status = "Invalid User";
        resolve(response);
      }
    })
  },
  //Address 
  getAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      const userAddress = await db.get().collection(collection.USER_COLLECTION).findOne(
        {
          _id: new objectId(userId),
        }
      );
      try {
        const addresses = userAddress.address;
        resolve(addresses);
      } catch {
        resolve("No addresses added")
      }
    })
  },

  addAddress: (address, userId) => {
    return new Promise((resolve, reject) => {
      // address.active = false;
      address.phone = Number(address.phone);
      address.postCode = Number(address.postCode);
      userId = new objectId(userId);
      address._id = new objectId();
      db.get().collection(collection.USER_COLLECTION).updateOne(
        {
          _id: new objectId(userId),
        },
        {
          $push: { address: address }
        }
      );
    })
  },

  editAddress: (info, userId, address) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne(
        {
          _id: new objectId(userId),
          "address._id": new objectId(address)
        },
        {
          $set: {
            "address.$.state": info.state,
            "address.$.name": info.name,
            "address.$.phone": Number(info.phone),
            "address.$.address": info.address,
            "address.$.city": info.city,
            "address.$.postCode": info.postCode,
            "address.$.type": info.type
          }
        }
      );
    })
  },

  deleteAddress: (addressId, userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION)
        .updateOne(
          {
            _id: new objectId(userId),
            "address._id": new objectId(addressId) // match the address with the specified id
          }, {
          $pull: { address: { _id: new objectId(addressId) } }
        }
        )
    })
  },

  // not used because of bug ;
  // changeAddressActive: (userId, addressId) => {
  //     return new Promise ((resolve, reject)=> {
  //         db.get().collection(collection.USER_COLLECTION)
  //         .updateMany(
  //             {
  //                 _id: new objectId(userId),
  //             },
  //             {
  //                 $set:{"address.$[].active": false}
  //             }
  //         );
  //         db.get().collection(collection.USER_COLLECTION)
  //         .updateOne(
  //             {
  //                 _id:  new objectId(userId),
  //                 address: {$elemMatch: { _id: new objectId(addressId)}}
  //             },
  //             {
  //                 $set: {"address.$.active": true}
  //             }
  //         )
  //         .then((response)=>{
  //             resolve(response);
  //         });
  //     });
  // },

  findAddress: (addressId, userId) => {
    return new Promise(async (resolve, reject) => {
      const address = await db.get().collection(collection.USER_COLLECTION).aggregate([
        { $match: { _id: new objectId(userId) } },
        { $unwind: "$address" },
        { $match: { "address._id": new objectId(addressId) } },
        { $project: { _id: 0, address: 1 } }
      ]).toArray();
      resolve(address[0].address)
    })
  },


  // Orders
  getOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      userId = new objectId(userId);
      const orders = await db.get().collection(collection.ORDER_COLLECTION).find(
        {
          userId: userId
        }
      ).sort({ date: -1 }).toArray();
      console.log(orders + "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
      resolve(orders);
    })
  },

  addOrderDetails: (order) => {
    // Object.assign(order, {status: "pending"});
    return new Promise((resolve, reject) => {
      order.date=new Date()
      db.get().collection(collection.ORDER_COLLECTION).insertOne(order)
        .then((response) => {
          console.log(response);
          resolve(response);
        })
        .catch(() => {
          reject();
        })
    })
  },

  getOrderedProduct: (ordersId) => {
    return new Promise(async (resolve, reject) => {
      ordersId = new objectId(ordersId);
      console.log(ordersId);
      const orders = await db.get().collection(collection.ORDER_COLLECTION).find({ _id: ordersId }).toArray();
      //                 { 
      //                   '$match': { 
      //                     '_id': ordersId 
      //                   } 
      //                 }, { 
      //                   '$unwind': { 
      //                     'path': '$products', 
      //                     'includeArrayIndex': 'string',  
      //                     'preserveNullAndEmptyArrays': true 
      //                   } 
      //                 }, { 
      //                   '$lookup': { 
      //                     'from': 'product',  
      //                     'localField': 'product.productId',  
      //                     'foreignField': '_id',  
      //                     'as': 'productDetails' 
      //                   } 
      //                 }, { 
      //                   '$project': { 
      //                     'productDetails': 1,  
      //                     '_id': 0, 
      //                     'products.quantity' : 1 
      //                   } 
      //                 } 
      //             ]).toArray(); 
      // console.log(orders);
      // console.log(orders[0].productDetails); 
      console.log(orders);
      resolve(orders);
    });
  },

  cancelOrder:(orderId, reason)=>{
    console.log("inside cancel")
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION)
      .updateOne({
        _id: new objectId(orderId),
        
      },
      {
        $set: {
          "status": "Cancelled",
          "cancel": reason
          }
      })
      .then((response)=>{resolve(response)})
    })
},

  //Address 
  getAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      const userAddress = await db.get().collection(collection.USER_COLLECTION).findOne(
        {
          _id: new objectId(userId),
        }
      );
      try {
        const addresses = userAddress.address;
        resolve(addresses);
      } catch {
        resolve("No addresses added")
      }
    })
  },

  addAddress: (address, userId) => {
    return new Promise((resolve, reject) => {
      // address.active = false;
      address.phone = Number(address.phone);
      address.postCode = Number(address.postCode);
      userId = new objectId(userId);
      address._id = new objectId();
      db.get().collection(collection.USER_COLLECTION).updateOne(
        {
          _id: new objectId(userId),
        },
        {
          $push: { address: address }
        }
      );
    })
  },

  editAddress: (info, userId, address) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne(
        {
          _id: new objectId(userId),
          "address._id": new objectId(address)
        },
        {
          $set: {
            "address.$.state": info.state,
            "address.$.name": info.name,
            "address.$.phone": Number(info.phone),
            "address.$.address": info.address,
            "address.$.city": info.city,
            "address.$.postCode": info.postCode,
            "address.$.type": info.type
          }
        }
      );
    })
  },

  deleteAddress: (addressId, userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION)
        .updateOne(
          {
            _id: new objectId(userId),
            "address._id": new objectId(addressId) // match the address with the specified id
          }, {
          $pull: { address: { _id: new objectId(addressId) } }
        }
        )
    })
  },

  // not used because of bug ;
  // changeAddressActive: (userId, addressId) => {
  //     return new Promise ((resolve, reject)=> {
  //         db.get().collection(collection.USER_COLLECTION)
  //         .updateMany(
  //             {
  //                 _id: new objectId(userId),
  //             },
  //             {
  //                 $set:{"address.$[].active": false}
  //             }
  //         );
  //         db.get().collection(collection.USER_COLLECTION)
  //         .updateOne(
  //             {
  //                 _id:  new objectId(userId),
  //                 address: {$elemMatch: { _id: new objectId(addressId)}}
  //             },
  //             {
  //                 $set: {"address.$.active": true}
  //             }
  //         )
  //         .then((response)=>{
  //             resolve(response);
  //         });
  //     });
  // },



  editProfile: (userId, info) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne(
        {
          _id: new objectId(userId)
        },
        {
          $set: {
            name: info.name,
            email: info.email,
            phone: Number(info.phone)
          }
        }
      ).then((response) => {
        resolve(response);
      })
    })
  },
  editPassword: (userId, info) => {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await db.get().collection(collection.USER_COLLECTION).findOne({
          _id: new objectId(userId)
        });

        if (user.password === info.oldPassword) {
          await db.get().collection(collection.USER_COLLECTION).updateOne(
            { _id: new objectId(userId) },
            { $set: { password: info.newPassword } }
          );
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        reject(error);
      }
    });
  },




  // editPassword: (userId, info) => {
  //   return new Promise( async (resolve, reject) => {
  //       const user = db.get().collection(collection.USER_COLLECTION).findOne({
  //           _id: new objectId(userId)
  //       })
  //       resolve(user);
  //   })
  // },





  findAddress: (addressId, userId) => {
    return new Promise(async (resolve, reject) => {
      const address = await db.get().collection(collection.USER_COLLECTION).aggregate([
        { $match: { _id: new objectId(userId) } },
        { $unwind: "$address" },
        { $match: { "address._id": new objectId(addressId) } },
        { $project: { _id: 0, address: 1 } }
      ]).toArray();
      resolve(address[0].address)
    })
  },


  // addToWishlist: (userId, productId) => {
  //   productId = new objectId(productId);

  //   return new Promise(async (resolve, reject) => {
  //       const finduser = await db.get().collection(collection.WISHLIST_COLLECTION).findOne(
  //           {
  //               userId: new objectId(userId)
  //           }
  //       )

  //       let productExist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne(
  //           {
  //               userId: new objectId(userId),
  //               product:{$elemMatch:{productId}}
  //           }
  //       );

  //       if(finduser){
  //           if(!productExist){
  //               db.get().collection(collection.WISHLIST_COLLECTION).updateOne(
  //                   {
  //                       userId: new objectId(userId)
  //                   },
  //                   {
  //                       $push: {product: {productId}}
  //                   }
  //               ).then(()=>{resolve()})

  //           }else{
  //               resolve();
  //           }

  //       }else{
  //           db.get().collection(collection.WISHLIST_COLLECTION).insertOne(
  //               {
  //                   userId: new objectId(userId),
  //                   product: [{productId: productId}],
  //               }
  //           ).then((response) => {
  //               resolve(response);
  //           }).catch((err) => {
  //               reject(err);
  //           })
  //       }
  //   });
  // },


  // addToWishlist: (userId, productId) => {
  //   productId = new objectId(productId);

  //   return new Promise(async (resolve, reject) => {
  //       const finduser = await db.get().collection(collection.WISHLIST_COLLECTION).findOne(
  //           {
  //               userId: new objectId(userId)
  //           }
  //       )

  //       let productExist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne(
  //           {
  //               userId: new objectId(userId),
  //               product:{$elemMatch:{productId}}
  //           }
  //       );

  //       if(finduser){
  //           if(!productExist){
  //               db.get().collection(collection.WISHLIST_COLLECTION).updateOne(
  //                   {
  //                       userId: new objectId(userId)
  //                   },
  //                   {
  //                       $push: {product: {productId}}
  //                   }
  //               ).then(()=>{resolve()})

  //           }else{
  //               db.get().collection(collection.WISHLIST_COLLECTION).updateOne(
  //                   {
  //                       userId: new objectId(userId),
  //                       product:{$elemMatch:{productId}}
  //                   },
  //                   {
  //                       $pull: {product: {productId}}
  //                   }
  //               ).then(()=>{resolve('Product removed from wishlist')})
  //           }

  //       }else{
  //           db.get().collection(collection.WISHLIST_COLLECTION).insertOne(
  //               {
  //                   userId: new objectId(userId),
  //                   product: [{productId: productId}],
  //               }
  //           ).then((response) => {
  //               resolve(response);
  //           }).catch((err) => {
  //               reject(err);
  //           })
  //       }
  //   });
  // },


  addToWishlist: (userId, productId) => {
    productId = new objectId(productId);

    return new Promise(async (resolve, reject) => {
      const finduser = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({
        userId: new objectId(userId)
      });

      let productExist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({
        userId: new objectId(userId),
        product: {
          $elemMatch: {
            productId
          }
        }
      });

      if (finduser) {
        if (!productExist) {
          db.get().collection(collection.WISHLIST_COLLECTION).updateOne({
            userId: new objectId(userId)
          }, {
            $push: {
              product: {
                productId
              }
            }
          }).then(() => {
            resolve("Added to Wishlist");
          })

        } else {
          db.get().collection(collection.WISHLIST_COLLECTION).updateOne({
            userId: new objectId(userId)
          }, {
            $pull: {
              product: {
                productId
              }
            }
          }).then(() => {
            resolve("Product removed from wishlist");
          })
        }

      } else {
        db.get().collection(collection.WISHLIST_COLLECTION).insertOne({
          userId: new objectId(userId),
          product: [{
            productId: productId
          }],
        }).then((response) => {
          resolve("Added to Wishlist");
        }).catch((err) => {
          reject(err);
        })
      }
    });
  },









  getWishlist: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
          {
            '$match': {
              'userId': new objectId(userId)
            }
          },
          {
            '$unwind': {
              'path': '$product'
            }
          },
          {
            '$lookup': {
              'from': 'product',
              'localField': 'product.productId',
              'foreignField': '_id',
              'as': 'result'
            }
          },
          {
            '$project': {
              '_id': 0,
              'product': {
                '$arrayElemAt': [
                  '$result', 0
                ]
              }
            }
          }
        ]).toArray();
        resolve(wishlist);
      } catch (err) {
        console.log(err);
        reject(err);
      }
    })
  },

  deleteWishlist: (userId, productId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.WISHLIST_COLLECTION).updateOne(
        {
          userId: new objectId(userId),
        },
        {
          $pull: {
            product: { productId: new objectId(productId) }
          }
        }
      )
      resolve();
    })
  },

  //Razorpay
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      total = Number(total).toFixed(0);
      orderId = String(orderId);
      instance.orders.create({
        amount: parseInt(total) * 100,
        currency: "INR",
        receipt: orderId,
      }, (err, order) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(order);
        }
      })

    })


  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {


      let hmac = crypto.createHmac('sha256', 'PgpfiQkJrfxLJnGVdHozQYeU');

      hmac.update(details.response.razorpay_order_id + '|' + details.response.razorpay_payment_id);
      hmac = hmac.digest('hex');
      console.log(JSON.stringify(details));
      if (hmac === details.response.razorpay_signature) {
        resolve();
      } else {
        reject();
      }
    });
  },

  changeOrderStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne(
        {
          _id: new objectId(orderId)
        },
        {
          $set: {
            status: "placed"
          }
        }
      ).then((response) => {
        resolve(response)
      }).catch((err) => {

        console.log(err);
      })
    })
  },

  returnProduct: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne(
        {
          _id: new objectId(orderId)
        },
        {
          $set: {
            status: "Return"
          }
        }
      ).then((response) => { resolve(response) })
    })
  },

  couponApply:(couponCode, userId)=>{
    return new Promise(async(resolve, reject)=>{
        const couponExists = await db.get().collection(collection.USER_COLLECTION)
        .findOne(
            {
                _id: new objectId(userId),
                usedCoupons: { $elemMatch: { couponCode } }
            }
        )
        const coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({code: couponCode});
        if(coupon){
            if(couponExists){
                resolve("couponExists");
            }else{
                resolve(coupon);
            }
        }else{
            resolve(null);
        }
    })
},

getWallet:()=> {
  return new Promise(async (resolve, reject)=> {
      const wallet = await db.get().collection(collection.WALLET_COLLECTION).find().toArray();
      resolve(wallet);
  })
},



// Banner
getActiveBanner:()=> {
  return new Promise((resolve, reject)=> {

      const activeBanner = db.get().collection(collection.BANNER_COLLECTION).findOne(
          {
              active: true
          }
      )
      resolve(activeBanner);
  })
},

returnProduct:(orderId, reason) => {
  return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne(
          {
              _id: new objectId(orderId)
          },
          {
              $set: {
                  status: "Return",
                  return: reason,
              }
          }
      ).then((response) => {resolve(response)})
  })
},





};




