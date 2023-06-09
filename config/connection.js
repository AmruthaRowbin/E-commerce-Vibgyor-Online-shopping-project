const mongoClient = require('mongodb-legacy').MongoClient;
const state = {
    db: null
}

// module.exports.connect = function(done){
//     const url = process.env.DATABASE_URL
//     const dbname = process.env.DB_NAME

//     mongoClient.connect(url, (err, data) => {
//         if(err){
//             return done(err);
//         }else{
//             state.db = data.db(dbname);
//         }
//         done();
//     })
// }
module.exports.connect = function (done) {
    const url = process.env.DATABASE_URL
    const dbname = process.env.DB_NAME
    mongoClient.connect(url, (err, data) => {
        if (err) return done(err)
        state.db = data.db(dbname)

    })
    done()
}
// test
module.exports.get = function(){
    return state.db
}