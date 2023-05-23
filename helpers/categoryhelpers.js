const db = require('../config/connection');
const collection = require('../config/collection');
const objectId = require('mongodb-legacy').ObjectId;

module.exports = {
   
    
    addCategory:(detailes) => {
        return new Promise (async (resolve, reject) => {
            const name=detailes.name
            const categoryName = detailes.name.toLowerCase();
                const Category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: { $regex: new RegExp("^" + categoryName + "$", "i") } })
                if(Category){
                    resolve(false);
                }else{
                    detailes.name = name
                    detailes.listed = true;
                    db.get().collection(collection.CATEGORY_COLLECTION).insertOne(detailes).then( (response) => {
                        db.get().collection(collection.PRODUCT_COLLECTION).updateMany(
                            {
                                category: detailes.name
                            },
                            {
                                $set: {
                                    listed: true
                                }
                            }
                        )
                        resolve(response.insertedId);
                    })
                }
        })
    },


    getCategory: () => {
        return new Promise(async (resolve, reject) => {
            const category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray();
            if (category) {
                console.log(category);
                resolve(category)
            } else {

                resolve("Category not found");
            }
        })
    },

    deleteCategory: (categoryId, cateName) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne(
                {
                    _id: new objectId(categoryId)
                }
            ).then(async () => {
                const listed = await db.get().collection(collection.PRODUCT_COLLECTION).updateMany(
                    {
                        category: cateName
                    },
                    {
                        $set: {
                            listed: false
                        }
                    }
                )
                console.log(listed);
                resolve();
            }).catch((err) => {
                console.log(err);
                reject();
            })
        })
    },

    getSelectedCategory: (catName) => {
        console.log(catName);
        return new Promise(async (resolve, reject) => {
            try {
                const products = await db.get().collection(collection.CATEGORY_COLLECTION).aggregate(
                    [
                        {
                            '$match': {
                                'name': catName
                            }
                        }, {
                            '$lookup': {
                                'from': collection.PRODUCT_COLLECTION,
                                'localField': 'name',
                                'foreignField': 'category',
                                'as': 'productDetails'
                            }
                        }, {
                            '$project': {
                                'productDetails': 1,
                                '_id': 0
                            }
                        }
                    ]).toArray();
                resolve(products[0].productDetails);
            } catch {
                resolve(null);
            }
        })
    }
}