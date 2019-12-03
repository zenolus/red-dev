require('dotenv').config();
const request = require('request');
const Discord = require('discord.js');
const {Enigmatic, Assignment} = require("./DBtools")
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const PREFIX = '+';
let doubtCounter = 0;
const problemCategories = ["implementation", "math", "data structures", "binary search", "sortings", "strings", "trees", "graphs",
                            "number theory", "greedy", "dp", "hashing", "divide and conquer", "bitmasks"]
bot.login(TOKEN);
bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}`);
    bot.user.setActivity('server requests', {type: "LISTENING"})
    const rChan = bot.channels.find("name", "Relax")
    rChan.join().then(connection=>{})
    setInterval(()=>{
        Enigmatic.find({}).then(users => {
            users.forEach(user=>{
                request(`https://codeforces.com/api/user.status?handle=${user.cfHandle}`, (error, response, body) => {
                    const submissions = JSON.parse(response.body).result
                    let solved = []
                    submissions.forEach(submission => {
                        if(submission.verdict === "OK"){
                            const pIndex = `${submission.problem.contestId}${submission.problem.index}`;
                            if(solved.indexOf(pIndex) === -1)
                                solved.push(pIndex)
                        }
                    })
                    const newUser = new Enigmatic({
                        discordID: user.discordID,
                        cfHandle: user.cfHandle,
                        solvedProblems: solved,
                        solvedAssignments: user.solvedAssignments,
                        score: user.score
                    })
                    Enigmatic.deleteOne({cfHandle: user.cfHandle}, (err, obj)=>{
                        if(err) console.error(err);
                        newUser.save().then(saved=>{})
                    })
                })
            })
        })
    }, 900000)  //Update every 15 minutes
})
bot.on('message', async message => {
    if(message.author.bot)  return;
    if(message.channel.type === 'dm')   return;
    if(!message.content.startsWith(PREFIX)) return;
    let msgArray = message.content.split(" ");
    let cmd = msgArray[0].slice(1);
    //Personal doubts screenshare
    if(cmd === `screenshare`){
        if(!message.member.roles.find(r => r.name === "Mentor"))
            return message.channel.send("Hold it, will ya? You are not eligible to use this command!")
        if(message.channel.parent.name !== 'Active Doubts')
            return message.channel.send("Prof. Oak's words echoed... There's a time and place for everything, but not now.")
        const vcID = message.author.lastMessage.member.voiceChannelID;
        if(!vcID){
            return message.channel.send("No connected voice channel found");
        }
        const sID = message.guild.id;
        const link = `https://discordapp.com/channels/${sID}/${vcID}`
        return message.channel.send(`Join your the Screen Share Channel that your mentor is in and click on this link\n${link}`);
    }
    //Webinar
    if(cmd === `webinar`){
        if(!message.member.roles.find(r => r.name === "Founder"))
            return message.channel.send("", {
                file: "https://i.kym-cdn.com/entries/icons/original/000/027/242/vault.jpg"
            });
        const webID = message.guild.channels.find(channel => channel.name === 'Webinar').id;
        if(!webID)  return console.error("No Webinar VC found");
        const webchan = message.guild.channels.find("name", "Webinar")
        let eve = message.guild.roles.find("name", "@everyone");
        webchan.overwritePermissions(eve, {
            CONNECT: true
        })
        setTimeout(() => {
            webchan.overwritePermissions(eve, {
                CONNECT: false
            })
        }, 3600000)
        const sID = message.guild.id;
        const link = `https://discordapp.com/channels/${sID}/${webID}`
        const webEmbed = new Discord.RichEmbed()
            .setTitle("Webinar Alert: Stating soon")
            .setDescription(`Join the Webinar VC and click on the link to join the Webinar\n[Webinar Link](${link})`)
            .setURL(link)
            .setTimestamp()
            .setColor("#EE0F6B")
            .setFooter("Created with love and coffee | By Zenolus#2582")
            const aChan = message.guild.channels.find("name", "announcements")
            aChan.send(webEmbed);
            return aChan.send("@everyone").then(m => setTimeout(() => m.delete(), 600000))
    }
    //Ask a doubt
    if(cmd === `ask`){
        const doubt = msgArray.slice(1).join(" ");
        if(!msgArray[1])
            return message.reply(`please specify your doubt!`);
        const dID = "0000".substring(0, 4-(""+doubtCounter).length)+doubtCounter;
        message.guild.createChannel(`doubt-${dID}`, "text")
            .then(chan => {
                let ment = message.guild.roles.find("name", "Mentor");
                let eve = message.guild.roles.find("name", "@everyone");
                let category = message.guild.channels.find(c => c.type === "category" && c.name === "Active Doubts")
                chan.setParent(category.id)
                chan.overwritePermissions(ment, {
                    SEND_MESSAGES: true,
                    READ_MESSAGES: true
                })
                chan.overwritePermissions(eve, {
                    SEND_MESSAGES: false,
                    READ_MESSAGES: false
                })
                chan.overwritePermissions(message.author, {
                    SEND_MESSAGES: true,
                    READ_MESSAGES: true
                })
                message.channel.send(`Your doubt has been raised in #${chan.name}.`)
                const embed = new Discord.RichEmbed()
                    .setColor("#93EE0F")
                    .setTitle(`${message.author.username}'s doubt`)
                    .setDescription(`Hey, ${message.author.username}! Please expand on the following in detail for ease of clarification.`)
                    .addField(`Doubt`, doubt)
                    .setFooter("Created with love and coffee | By Zenolus#2582")
                    .setTimestamp()
                chan.send(embed);
                doubtCounter++;
            }).catch(console.error);
    }
    //Close a doubt
    if(cmd === `close`){
        if(!message.channel.name.startsWith(`doubt-`))  return message.channel.send(`You can't use this command outside of a doubt channel!`)
        message.channel.send(`Are you sure? Once confirmed, you can't reverse this action!\nTo confirm, type \`+confirm\`. This will timeout in 10 seconds and be cancelled.`)
            .then(m => {
                message.channel.awaitMessages(response => response.content === '+confirm', {
                    max: 1,
                    time: 10000,
                    error: ['time']
                })
                .then((collected) => {
                    if(!collected.size)
                        return m.edit(`Doubt closing request timed out, the channel was not closed.`);
                    message.channel.delete()
                })
            })
    }
    //Register CodeForces ID
    if(cmd === `cf`){
        if(!msgArray[1])
            return message.reply(`missing codeforces handle!`);
        Enigmatic.find({discordID: message.author.id.toString()}).then(result=>{
            if(result[0] !== undefined)
                return message.channel.send("You have already registered your codeforces handle. If you have any issue regarding your existing ID, please contact \`Zenolus#2582\`.");
            const handle = msgArray[1].toString()
            request(`https://codeforces.com/api/user.info?handles=${handle}`, (error, response, body) => {
                const status = JSON.parse(response.body).status
                if(status !== "OK")
                    return message.reply(`invalid codeforces handle!`)
                request(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=100000`, (error, response, body) => {
                    const submissions = JSON.parse(response.body).result
                    let solved = []
                    submissions.forEach(submission => {
                        if(submission.verdict.toString() === "OK"){
                            const pIndex = `${submission.problem.contestId}${submission.problem.index}`;
                            if(solved.indexOf(pIndex) === -1)
                                solved.push(pIndex)
                        }
                    })
                    const user = new Enigmatic({
                        discordID: message.author.id.toString(),
                        cfHandle: handle,
                        solvedProblems: solved,
                        solvedAssignments: [],
                        score: 0,
                    })
                    user.save().then(saved => {
                        return message.reply(`you can now submit solutions to assignment problems.`)
                    })
                })
            })
        })
    }
    //Generate random practice problem
    if(cmd === `practice`){
        const tagIndex = msgArray[1]?Number(msgArray[1])-1:Math.floor(Math.random()*problemCategories.length)
        if(tagIndex >= problemCategories.length)
            return message.reply(`please enter a valid tag ID`)
        const tag = problemCategories[tagIndex]
        let problemset = [];
        request(`https://codeforces.com/api/problemset.problems?tags=${tag}`, (error, response, body) => {  
            const data = JSON.parse(response.body).result.problems
            data.forEach(problem => {
                if(problem.index[0] <= 'C')
                    problemset.push(problem)
            })
            const prIndex = Math.floor(Math.random()*problemset.length);
            const problem = problemset[prIndex];
            const embed = new Discord.RichEmbed()
                .setTitle("Practice Problem")
                .setDescription(`Requested by ${message.author.username}`)
                .setColor("#FFDF00")
                .setTimestamp()
                .setFooter('Created with love and coffee | By Zenolus#2582')
                .setThumbnail('https://assets.codeforces.com/users/kguseva/comments/problem.png')
                .addField("Problem Name", problem.name)
                .addField('Problem Tags', problem.tags.join(", "), true)
                .addField('Problem Link', `[CodeForces: ${problem.contestId}${problem.index}](https://codeforces.com/contest/${problem.contestId}/problem/${problem.index})`, true)
            return message.channel.send(embed)
        })
    }
    //Post assignment questions
    if(cmd === `post`){ //+post [category] [points-3][contestId][index]
        if(msgArray.length<=2)
            return message.channel.send("Please enter category and problem IDs");
        if(!message.member.roles.find(r => r.name === "Founder"))
            return message.channel.send("That's not for you, sorry!")
        request(`https://codeforces.com/api/problemset.problems?tags=`, (error, response, body) => {
            const data = JSON.parse(response.body).result.problems
            const category = msgArray[1]
            const assign = msgArray.slice(2)
            const embed = new Discord.RichEmbed()
                .setTitle(`Assignment @ ${(new Date()).toString().split(" ").slice(1,4).join("/")}`)
                .setDescription(`Category -> ${category}`)
                .setTimestamp()
                .setColor("#FA00FA")
                .setFooter('Created with love and coffee | By Zenolus#2582')
                .setThumbnail('https://previews.123rf.com/images/ionutparvu/ionutparvu1612/ionutparvu161200799/67602385-assignment-stamp-sign-text-word-logo-green-.jpg')
            assign.forEach(prob => {
                const problem = data.find(p => prob[prob.length-1]===p.index && prob.substr(3, prob.length-4) === p.contestId.toString())
                if(problem === undefined)
                    return message.reply(`Invalid problem ${prob}!`)
                const pts = Number(prob.substr(0, 3))
                embed.addField(`${problem.name}`, `[CodeForces: ${prob.substr(3)}](https://codeforces.com/contest/${problem.contestId}/problem/${problem.index})\nPoints: ${pts}`,true)
                const asgnDBobj = new Assignment({
                    problemIndex: prob.substr(3),
                    problemPoints: pts
                })
                Assignment.find({problemIndex: prob.substr(3)}).then(result => {
                    if(result[0] !== undefined)
                        return message.channel.send(`${prob.substr(3)} has already been given`)
                    asgnDBobj.save()
                    const aChan = message.guild.channels.find("name", "assignments")
                    return aChan.send(embed);
                })
            })
        })
    }
    //Submit solution to assignment question
    if(cmd === `submit`){
        if(message.member.roles.find(r => r.name === "Mentor"))
            return message.channel.send("Mentors don't need to submit assignments.")
        if(!msgArray[1])
            return message.reply(`please provide an assignment problem index!`)
        const pIndex = msgArray[1];
        const cID = pIndex.substr(0, pIndex.length-1)
        const iID = pIndex[pIndex.length-1]
        Enigmatic.find({discordID: message.author.id}).then(result=>{
            if(result[0] === undefined)
                return message.reply(`you have not registered your CodeForces handle with us. Please use \`+cf [handle]\` command first`)
            const user = result[0]
            if(user.solvedAssignments.find(asn => asn === pIndex))
                return message.reply(`you have already submitted this assignment!`)
            Assignment.find({problemIndex: pIndex}).then(result=>{
                if(result[0] === undefined)
                    return message.reply(`invalid assignment index!`)
                const asgn = result[0]
                request(`https://codeforces.com/api/user.status?handle=${user.cfHandle}`, (error, response, body) => {
                    const data = JSON.parse(response.body).result
                    const submission = data.find(sub => sub.problem.contestId.toString() === cID && sub.problem.index === iID && sub.verdict === "OK")
                    if(submission === undefined || ((new Date()).getTime() - (new Date(submission.creationTimeSeconds * 1000)).getTime())/(1000*3600*24) > 2)
                        return message.reply(`your AC submission was not found. Please make sure that you have solved and submitted it in the last 48 hours.`)
                    let sAsgn = [...user.solvedAssignments]
                    sAsgn.push(pIndex)
                    const newUser = new Enigmatic({
                        discordID: user.discordID,
                        cfHandle: user.cfHandle,
                        solvedProblems: user.solvedProblems,
                        solvedAssignments: sAsgn,
                        score: user.score + asgn.problemPoints
                    })
                    Enigmatic.deleteOne({cfHandle: user.cfHandle}, (err, obj)=>{
                        if(err) console.error(err);
                        newUser.save().then(saved=>{})
                    })
                    newUser.save().then(saved => {
                        return message.reply(`your submission has been recorded. Your current assignment score is: ${newUser.score}`)
                    })
                })
            })
        })
    }
    //Leaderboard
    if(cmd === `leaderboard`){
        const list = []
        Enigmatic.find({}).then(users=>{
            users.forEach(user => {
                list.push({
                    cfHandle: user.cfHandle,
                    discordID: user.discordID,
                    score: user.score,
                    solved: user.solvedProblems.length
                })
            })
            list.sort((a, b) => {
                if(a.score < b.score)
                    return true;
                else if(a.score === b.score && a.solved < b.solved)
                    return true;
                return false;
            })
            const len = Math.min(10, list.length)
            const embed = new Discord.RichEmbed()
                .setTitle("Leaderboard")
                .setDescription("Ranking of members based on their assignment scores")
                .setTimestamp()
                .setFooter("Created with love and coffee | By Zenolus#2582")
                .setThumbnail('https://imgur.com/NqdtWu5.png')
                .setColor("#5000FC")
            let ranks = ""
            for(var i = 0; i < len; i++){
                switch(i){
                    case 0: ranks += `:first_place:`; break;
                    case 1: ranks += `:second_place:`; break;
                    case 2: ranks += `:third_place:`; break;
                    default: ranks += `${i+1}.`
                }
                ranks += ` ${list[i].cfHandle} (<@${list[i].discordID}>) : \`${list[i].score} pts\` (Total problems solved : ${list[i].solved})\n`
            }
            embed.addField("The top scorers are:-", ranks)
            return message.channel.send(embed)
        })
    }
    //Help
    if(cmd === `help`){
        const embed = new Discord.RichEmbed()
            .setTitle("Help")
            .setFooter("Created with love and coffee | By Zenolus#2582")
            .setTimestamp()
            .setColor("#EB00FC")
            .setThumbnail('https://www.gifa.com/cache/pica/6/9/9/2/1/4/7701536839604/icon_hilfe_weiss_hintergrund_transparent_4-3.png')
        let modules = `\`+cf [handle]\` : Register your CodeForces handle with us to submit your assignments\n
        \`+help\` : Brings out this help message\n
        \`+practice <topicID>\` : Get a practice problem. topicID is optional. If not specified, problem will be of random topic\n
        \`+topics\` : Get the list of topics and their topicIDs for using in the \`+practice\` command\n
        \`+ask [doubt]\` : Ask a doubt for one-to-one doubt clearing in an exclusive channel\n
        \`+close\` : Close a doubt channel if solved or no longer required (Works only in doubt channels)\n
        \`+submit [problemIndex]\` : Submit an assignment problem to get the corresponding points\n
        \`+leaderboard\` : Shows the leaderboard\n
        \`+screenshare\` : [Mentors only] Begin a screenshare session in the Screenshare channel that you are in, for doubt clearing\n
        `
        embed.addField("Available Bot Modules", modules)
        return message.channel.send(embed)
    }
    //TopicIDs
    if(cmd === `topics`){
        let msg = "Available topics are\n"
        problemCategories.forEach((cat, i) => msg += `${i+1}. ${cat}\n`)
        return message.reply(msg)
    }
})