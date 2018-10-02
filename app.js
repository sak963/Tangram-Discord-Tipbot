const Discord  = require ("discord.js");
const bot      = new Discord.Client();
const request  = require ("request");
const User     = require ("./models/user.js");      
const mongoose = require ("mongoose");
// CONNECT TO DATABASE
mongoose.connect("mongodb://path");
      
      bot.on("ready", ()=>{
          console.log("Bot up!");
      });
      
// SET PASSWORD FOR TANGRAM WALLET
const password   = "";

      bot.on("message", (message)=> {
        //   DISPLAY COMMANDS
          if (message.content == "!help"){
            const embed= new Discord.RichEmbed();
            embed.setTitle("Welcome to TangramBot v 0.1! Those are the commands:");
            embed.addField("!start", "Registers your account");
            embed.addField("!create", "Generates your Tangram address");
            embed.addField("!balance", "Returns your account's balance");
            embed.addField("!deposit", "Returns your deposit address");
            message.channel.send(embed);
          }
        // CREATES NEW WALLET
          if (message.content=="!start"){
              User.findOne({discordId:message.author}, function (er, foundUser){
                 if (er){
                     console.log(er);
                 } else if (foundUser){
                     message.channel.send("You already started");
                 } else {
                      message.channel.send("Creating your wallet...");
                      const   headers = {
  "accept": "application/json",
  "Authorization": "",
  "Content-Type": "application/json",
};
                      const   options={
    url: "http://41.185.26.184:8081/actor/wallet/create",
    method: 'POST',
    headers: headers,
    form: {"password": password}
};

request(options, function(error, response, body) {
  if (!error && response.statusCode == 201) {
        body= JSON.parse(body);
       User.create({discordId:message.author, walletId:body.id}, function (err, newUser){
           if (err){
               console.log(err);
               message.channel.send("Error, please try again");
           } else {
               message.channel.send("Registered! type '!create' to generate your address =D");
           }
       });
  } else {
               message.channel.send("Error, please try again");
  }

  
});
                 }
              });

          }
        //   GENERATE ADDRESS
         if (message.content=="!create"){
             
             User.findOne({discordId: message.author}, function (err, user){
    if (err){
      message.channel.send("Please, register first (type !register) ");
    } else if (user && user.address == undefined) {
          message.channel.send("Generating address...");
          const    headers = {
  "accept": "application/json",
  "Authorization": "",
  "Content-Type": "application/json",
};
          const    options={
    url: "http://41.185.26.184:8081/actor/wallet/address",
    method: 'POST',
    headers: headers,
    form: {"identifier":user.walletId, "password": password}
};

request(options, function (error, response, body){
    if (!error && response.statusCode == 201){
               body= JSON.parse(body);
              user.address = body.address;
              user.save();
              message.channel.send("Your address is: " + user.address);
    } else {
        message.channel.send("Error, please try again");
    }
});
    } else {
        message.channel.send("You already got an address or didn't !start ");
    }
            
});

         } 
        //  DISPLAY BALANCE
        if (message.content=="!balance"){
            User.findOne({discordId:message.author}, function (error, user){
               if (error){
                   message.channel.send("Something went wrong");
               } else if (user && user.address){
                    const    headers = {
  "accept": "application/json",
  "Authorization": "",
  "Content-Type": "application/json",
};
                    const    options={
    url: "http://41.185.26.184:8081/actor/wallet/balance",
    method: 'POST',
    headers: headers,
    form: {"identifier": user.walletId, "password": password, "address": user.address}
};
request(options, function (error, response, body){
    if (!error && response.statusCode == 201){
        body = JSON.parse(body);
        message.channel.send("Your balance is: " + body.balance + " $TGM");
    } else {
        message.channel.send("Something went wrong, please try again");
    }
});
               } else{
                   return message.channel.send("Please generate your address first");
               }
            });
        }
        // RETURN DEPOSIT ADDRESS
        if (message.content == "!deposit"){
            User.findOne({discordId: message.author}, function (error, user){
                if (error){
                    console.log(error);
                    message.channel.send("Something went wrong");
                } else if (user && user.address){
                    const    headers = {
  "accept": "application/json",
  "Authorization": "",
  "Content-Type": "application/json",
};
                    const    options={
    url: "http://41.185.26.184:8081/actor/wallet",
    method: 'POST',
    headers: headers,
    form: {"identifier": user.walletId, "password": password}
};
request(options, function (err, response, body){
   if (!err && response.statusCode == 201){
       body = JSON.parse(body);
       message.channel.send("Your deposit address is: " + body.addresses[0].base58);
   } else {
       console.log(err);
       message.channel.send("Bad request, please try again");
   }
});
                } else {
                    message.channel.send("Please, generate your address first");
                }
            });
        }
        
      });
    //   ADD YOUR BOT TOKEN
      bot.login("");