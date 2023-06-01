const db = require('../config/connection');
const collection = require('../config/collection');
const bcrypt = require('bcrypt');
const objectId = require('mongodb-legacy').ObjectId
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { json } = require('body-parser');
const { count } = require('console');





//var razorpay_key_id = "rzp_test_FyWlYra71TAw6C"
//var razorpay_key_secret = "ieGubz9JCjCmkvhbL8t8npxk"

var instance = new Razorpay({
  key_id: 'rzp_test_pAzUmloFW4AZ9X',
  key_secret: 'VNkIiMPVosxmH3iOpJySZSgO'
  ,
})

module.exports = {

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




  getOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      userId = new objectId(userId);
      const orders = await db.get().collection(collection.ORDER_COLLECTION).find(
        {
          userId: userId
        }
      ).sort({ _id: -1 }).toArray();
      resolve(orders);
    });
  },



  addOrderDetails: (order, userId) => {
    return new Promise(async (resolve, reject) => {
      if (order.coupon != 'undefined') {
        const couponCode = order.coupon;
        const coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({
          code: order.coupon
        });
        order.coupon = coupon;
        try {
          const couponExist = await db.get().collection(collection.USER_COLLECTION).findOne(
            {
              _id: new objectId(userId),
              usedCoupons: { $elemMatch: { couponCode } },
            },
          )
          if (!couponExist) {
            db.get().collection(collection.USER_COLLECTION).updateOne(
              {
                _id: new objectId(userId)
              },
              {
                $push: {
                  usedCoupons: { couponCode }
                }
              }
            )
          }
        } catch (err) {
          console.log(err)
        } finally {

          db.get().collection(collection.ORDER_COLLECTION).insertOne(order)
            .then(async (response) => {
              resolve(response);
              for (let i = 0; i < order.item.length; i++) {

                const stock = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                  {
                    _id: order.item[i].product._id
                  },
                  {
                    $inc: {
                      stock: -order.item[i].quantity
                    }
                  }
                )
              }
            })
            .catch((err) => {
              reject(err);
            })
        }
      } else {
        delete order.coupon

        db.get().collection(collection.ORDER_COLLECTION).insertOne(order)
          .then(async (response) => {
            resolve(response);
            for (let i = 0; i < order.item.length; i++) {
              const stock = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                {
                  _id: order.item[i].product._id
                },
                {
                  $inc: {
                    stock: -order.item[i].quantity
                  }
                }
              )
            }
          })
          .catch((err) => {
            reject(err);
          })
      }

    })
  },



  cancelOrder: (orderId, reason) => {
    return new Promise((resolve, reject) => {
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
        .then((response) => { resolve(response) })
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


      let hmac = crypto.createHmac('sha256', 'VNkIiMPVosxmH3iOpJySZSgO');

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

  couponApply: (couponCode, userId) => {
    return new Promise(async (resolve, reject) => {
      const couponExists = await db.get().collection(collection.USER_COLLECTION)
        .findOne(
          {
            _id: new objectId(userId),
            usedCoupons: { $elemMatch: { couponCode } }
          }
        )
      const coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ code: couponCode });
      if (coupon) {
        if (couponExists) {
          resolve("couponExists");
        } else {
          resolve(coupon);
        }
      } else {
        resolve(null);
      }
    })
  },

  getWallet: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const wallet = await db.get().collection(collection.WALLET_COLLECTION).findOne({ _id: new objectId(userId) });
        resolve(wallet);
      } catch (error) {
        reject(error);
      }
    });
  },


  // Banner
  getActiveBanner: () => {
    return new Promise((resolve, reject) => {

      const activeBanner = db.get().collection(collection.BANNER_COLLECTION).findOne(
        {
          active: true
        }
      )
      resolve(activeBanner);
    })
  },

  returnProduct: (orderId, reason) => {
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
      ).then((response) => { resolve(response) })
    })
  },


  profileImage: (userId, imageUrl) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: new objectId(userId) },
          { $set: { image: imageUrl } }
        )
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  getUser: (userId) => {

    return new Promise(async (resolve, reject) => {

      const user = await db.get().collection(collection.USER_COLLECTION).findOne(
        {
          _id: new objectId(userId)
        }
      )
      console.log(user);
      resolve(user);
    })
  },

  getOrderedProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      orderId = new objectId(orderId);
      const order = await db.get().collection(collection.ORDER_COLLECTION).find({ _id: orderId }).toArray();
      resolve(order);
    });
  },
  getOrderedProduct: (ordersId) => {
    return new Promise(async (resolve, reject) => {
      ordersId = new objectId(ordersId);
      console.log(ordersId);
      const orders = await db.get().collection(collection.ORDER_COLLECTION).find({ _id: ordersId }).toArray();

      console.log(orders);
      resolve(orders);
    });
  },


  getSingleorder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: new objectId(orderId) }).then((orderdata) => {
        resolve(orderdata)

      })

    })

  },

  getCoupon: () => {
    return new Promise(async (resolve, reject) => {
      const coupon = db.get().collection(collection.COUPON_COLLECTION).find().toArray();
      resolve(coupon);
    })
  },


  changeOrderPaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne(
        {
          _id: new objectId(orderId)
        },
        {
          $set: {
            status: "failed"
          }
        }
      ).then((response) => {
        resolve(response)
      }).catch((err) => {

        console.log(err);
      })
    })
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      user = userId;
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ userId: new objectId(user) });
      if (cart) {
        count = cart.product.length;  // Change 'products' to 'product'
      }
      resolve(count)
    });
  },

};




