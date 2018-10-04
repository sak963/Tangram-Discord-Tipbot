const Discord = require("discord.js");
const bot = new Discord.Client();
const request = require("request");
const User = require("./models/user.js");
const mongoose = require("mongoose");
// CONNECT TO DATABASE
mongoose.connect("mongodb://path");

bot.on("ready", () => {
    console.log("Bot up!");
});

// SET PASSWORD FOR TANGRAM WALLET
const password = "";

bot.on("message", (message) => {
    //   DISPLAY COMMANDS
    if (message.content == ".help") {
        const embed = new Discord.RichEmbed();
        embed.setTitle("Welcome to TangramBot v 0.2! Those are the commands:");
        embed.addField(".register", "Registers your account");
        embed.addField(".create", "Generates your Tangram address");
        embed.addField(".balance", "Returns your account's balance");
        embed.addField(".deposit", "Returns your deposit address");
        embed.addField(".claim", "Claims 100 testnet $TGM");
        embed.addField(".tip [discorduser] [amount]", "Tips a discord user $TGMs (e.g.    .tip @PedroLark 100)");
        message.channel.send(embed);
    }
    // CREATES ACCOUNT
    if (message.content == ".register") {
        User.findOne({ discordId: message.author }, function (error, foundUser) {
            if (error) {
                console.log(error);
            } else if (foundUser) {
                message.channel.send("You already are registered " + foundUser.discordId);
            } else {
                message.channel.send("Loading...");
                const headers = {
                    "accept": "application/json",
                    "Authorization": "",
                    "Content-Type": "application/json",
                };
                const options = {
                    url: "",
                    method: 'POST',
                    headers: headers,
                    form: { "password": password }
                };

                request(options, function (error, response, body) {
                    if (!error && response.statusCode == 201) {
                        body = JSON.parse(body);
                        User.create({ discordId: message.author, walletId: body.id }, function (err, newUser) {
                            if (err) {
                                console.log(err);
                                message.channel.send("Error, please try again");
                            } else {
                                User.findOne({ discordId: message.author }, function (xer, user) {
                                    if (xer) {
                                        console.log(xer);
                                    } else if (user && user.address == undefined) {
                                        const headers = {
                                            "accept": "application/json",
                                            "Authorization": "",
                                            "Content-Type": "application/json",
                                        };
                                        const options = {
                                            url: "http://41.185.26.184:8081/actor/wallet/address",
                                            method: 'POST',
                                            headers: headers,
                                            form: { "identifier": user.walletId, "password": password }
                                        };
                                        request(options, function (er, rresponse, bbody) {
                                            if (!er && rresponse.statusCode == 201) {
                                                bbody = JSON.parse(bbody);
                                                user.address = bbody.address;
                                                user.save();
                                                message.channel.send("Registered! Your address is: " + user.address);
                                            } else {
                                                message.channel.send("Error, please try again");
                                            }
                                        });
                                    }
                                });
                            }
                        });



                    } else {
                        message.channel.send("Error, please try again");
                    }


                });
            }
        });

    }
    //  DISPLAY BALANCE
    if (message.content == ".balance") {
        User.findOne({ discordId: message.author }, function (error, user) {
            if (error) {
                message.channel.send("Something went wrong");
            } else if (user && user.address) {
                const headers = {
                    "accept": "application/json",
                    "Authorization": "",
                    "Content-Type": "application/json",
                };
                const options = {
                    url: "http://41.185.26.184:8081/actor/wallet/balance",
                    method: 'POST',
                    headers: headers,
                    form: { "identifier": user.walletId, "password": password, "address": user.address }
                };
                request(options, function (error, response, body) {
                    if (!error && response.statusCode == 201) {
                        body = JSON.parse(body);
                        message.channel.send("Your balance is: " + body.balance + " $TGM");
                    } else {
                        message.channel.send("Something went wrong, please try again");
                    }
                });
            } else {
                return message.channel.send("Please generate your address first");
            }
        });
    }
    // RETURN DEPOSIT ADDRESS
    if (message.content == ".deposit") {
        User.findOne({ discordId: message.author }, function (error, user) {
            if (error) {
                console.log(error);
                message.channel.send("Something went wrong");
            } else if (user && user.address) {
                const headers = {
                    "accept": "application/json",
                    "Authorization": "",
                    "Content-Type": "application/json",
                };
                const options = {
                    url: "http://41.185.26.184:8081/actor/wallet",
                    method: 'POST',
                    headers: headers,
                    form: { "identifier": user.walletId, "password": password }
                };
                request(options, function (err, response, body) {
                    if (!err && response.statusCode == 201) {
                        body = JSON.parse(body);
                        message.channel.send("Your deposit address is: " + body.addresses[0].base58);
                    } else {
                        message.channel.send("Bad request, please try again");
                    }
                });
            } else {
                message.channel.send("Please, generate your address first");
            }
        });
    }
    // TIP COMMAND
    if (message.content == ".tip " + message.content.slice(5, 27) + message.content.slice(27, message.content.length)) {
        User.findOne({ discordId: message.content.replace("!", "").slice(5, 26) }, function (error, receiverUser) {
            if (error) {
                message.channel.send("Something went wrong");
                return console.log(error);
            } else if (receiverUser && receiverUser.address) {
                User.findOne({ discordId: message.author }, function (err, senderUser) {
                    if (err) {
                        message.channel.send("Something went wrong");
                        return console.log(err);
                    } else if (senderUser.discordId == receiverUser.discordId) {
                        message.channel.send("You can't send $TGM to yourself :p");
                    } else if (senderUser && senderUser.address && senderUser) {
                        const headers = {
                            "accept": "application/json",
                            "Authorization": "",
                            "Content-Type": "application/json",
                        };
                        const options = {
                            url: "http://41.185.26.184:8081/actor/wallet/transfer/funds",
                            method: 'POST',
                            headers: headers,
                            form: { "identifier": senderUser.walletId, "password": password, "account": senderUser.address, "change": senderUser.address, "link": receiverUser.address, "amount": message.content.slice(27, message.content.length) }
                        };
                        message.channel.send("Sending...");
                        request(options, function (er, response, body) {
                            if (!er && response.statusCode == 201) {
                                body = JSON.parse(body);
                                return message.channel.send("You sent " + message.content.slice(27, message.content.length) + " $TGM to " + receiverUser.discordId);
                            } else if (response.statusCode == 500 || response.statusCode == 411 || response.statusCode == 406) {
                                return message.channel.send("Insufficient funds");
                            } else {
                                return message.channel.send("Bad request");
                            }
                        });
                    } else if (!senderUser || !senderUser.address) {
                        message.channel.send("You don't have an address, please generate one first");
                    }
                });
            }
            else if (!receiverUser) {
                message.channel.send("This user is not registered");
            }
        });
    }
    //  CLAIM COMMAND
    if (message.content == ".claim") {
        User.findOne({ discordId: message.author }, function (error, user) {
            if (error) {
                return console.log(error);
            } else if (user && user.address) {
                const headers = {
                    "accept": "application/json",
                    "Authorization": "",
                    "Content-Type": "application/json",
                };
                const options = {
                    url: "http://41.185.26.184:8081/actor/wallet/reward",
                    method: 'POST',
                    headers: headers,
                    form: { "identifier": user.walletId, "password": password, "address": user.address, "amount": 100 }
                };
                request(options, function (err, response, body) {
                    if (!err && response.statusCode == 201) {
                        body = JSON.parse(body);
                        message.channel.send("You claimed 100 $TGM");
                    } else {
                        message.channel.send("Bad request");
                    }
                });
            } else {
                message.channel.send("Please generate your address first");
            }
        });
    }
});

bot.login("");
