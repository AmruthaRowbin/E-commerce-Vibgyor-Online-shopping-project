const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'danhqioha',
    api_key: 512932523787677,
    api_secret: '1BI4vrRTdnyNct1Rd4cpzpUF7LI'
});

module.exports = cloudinary;