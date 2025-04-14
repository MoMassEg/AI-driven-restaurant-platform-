const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, 
    password: { type: String, required: true },
    role: { type: String, required: true },
    id: { type: String, required: true, unique: true }, 
    phone: { type: String, required: true },
    address: { type: String, required: true },
    emailCheck: { type: Boolean, default: false },
    emailcode: { type: Number },
    fgpo: { type: Number },
    Lprod: { type: String, default: 'grilled almond barfi' }
})

const UserModel = mongoose.model("user", UserSchema)
module.exports = UserModel