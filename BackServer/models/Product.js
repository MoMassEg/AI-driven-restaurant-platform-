const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    Food_ID: Number,
    Name: String,
    C_Type: String,
    Veg_Non: String,
    Describe: String
}, { collection: "product" });  

const ProductModel = mongoose.model("Product", ProductSchema); 
module.exports = ProductModel;
