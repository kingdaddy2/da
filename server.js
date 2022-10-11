const express = require("express");
const { createServer } = require("http");
const app = express();
const server = createServer(app);
const helmet = require("helmet");
var cookieSession = require('cookie-session')
var Keygrip = require('keygrip')
const { Database } = require("quickmongo");
const db = new Database("mongodb+srv://kingdaddy:12345678@@aa@rhyno.li9sv.mongodb.net/data");
const  Discord = require("discord.js");
const FormData = require("form-data");
const fetch = require("node-fetch");
const client = new Discord.Client();
client.login('NzY4NTU2OTgxODIwNDU3MDUx.X5CMdw.6QqMhi3egbP_5HQeungHYHTgY3w')
app.set("view engine", "ejs");

let mods = ["700656817344086078"]

db.on("ready", () => {
  console.log("Database connected!");
});

app.use(express.static("public"));
app.use(require("serve-favicon")('./assets/Logo.jpg'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: new Keygrip(['key1', 'key2'], 'SHA384', 'base64'),
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.get('/',async (req, res) => {
  let user = req.session.user
  if(!user) {
    user = null
  }
  let isUserPremium = true
  let isUserMod = true
/*
  if(user) {
   isUserPremium = await db.fetch(`user_${user.id}.isPremium`);
  } 

  if(mods.includes(user.id)) {
    isUserMod = true
  }
  */

  res.render('index.ejs', { 
    user: user,
    isUserPremium: isUserPremium,
    isUserMod: isUserMod
  })
})


app.get("/support", (req, res) => res.redirect("https://discord.gg/Acb5QtxqkA"));





//Authorize
let config = {
  website: {
    redirectURI:"http://localhost:3000/callback",
    clientSecret: "G77PDkWMimcK8jIOeFlNv363hhAInW9l",
    scopes: ["identify","connections","email","guilds.join","guilds"],
    clientID: "768556981820457051"
  },
}


const Check = (req, res, next) => {
    req.session.backURL = req.url || "/";
    if (!req.session.user) return res.redirect('/login')
    else return next();
}

app.get('/login', (req, res) => {
    const authorizeUrl = `https://discordapp.com/api/oauth2/authorize?client_id=${config.website.clientID}&redirect_uri=${encodeURIComponent(config.website.redirectURI)}&response_type=code&scope=${config.website.scopes.join('%20')}`;
    res.redirect(authorizeUrl);
});

app.get('/callback', (req, res) => {
    if (req.session.user) return res.redirect(req.session.backURL || '/');

    const accessCode = req.query.code;
    if (!accessCode) return res.redirect("/");

    const data = new FormData();
    data.append('client_id', config.website.clientID);
    data.append('client_secret', config.website.clientSecret);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', config.website.redirectURI);
    data.append('scope', config.website.scopes.join(' '));
    data.append('code', accessCode);

    fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: data
    })
        .then(res => res.json())
        .then(response => {
            fetch('https://discord.com/api/users/@me', {
                method: 'GET',
                headers: {
                    authorization: `${response.token_type} ${response.access_token}`
                },
            })
                .then(res2 => res2.json())
                .then(async user => {
                    user = new Discord.User(client, user);
                    user.access_token = response.access_token
                    await db.set(`user_${user.id}.accesToken`, response.access_token)
                    req.session.user = user;
                    res.redirect(req.session.backURL || '/');
                });

            });
});

app.get('/logout', Check, (req, res) => {
    req.session = null 
       return res.redirect('/');
});


app.get('/manage-server', Check, async (req, res) => {
  let user = req.session.user
  if(!user) {
    user = null
  }
  let isUserPremium = true
  let isUserMod = true
  let guilds =await getGuilds(user)
  console.log(guilds)
/*
  if(user) {
   isUserPremium = await db.fetch(`user_${user.id}.isPremium`);
  } 

  if(mods.includes(user.id)) {
    isUserMod = true
  }
  */
  res.render('choose-server.ejs', { 
    user: user,
    isUserPremium: isUserPremium,
    isUserMod: isUserMod,
    guilds:guilds
  })
});
//
server.listen(3000, () => {
    console.log("Server is up and running! *"+3000);
});



//functions


async function getGuilds(user) {
       fetch(`https://discord.com/api/users/@me/guilds`, { 
      method: 'GET',
      headers: {
          authorization: `Bearer ${user.access_token}`,
  }
  }).then(async response => {
      let check = await response.json()
     return check;
      
  })
}