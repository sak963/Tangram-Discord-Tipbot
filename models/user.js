const mongoose = require ("mongoose");

const UserSchema= new mongoose.Schema({
    discordId: String,
    walletId:  String,
    address:   String
}),
      User = mongoose.model("User", UserSchema);
      
      module.exports = User;