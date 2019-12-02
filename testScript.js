require('dotenv').config()
const mongoose = require('mongoose')
const url = process.env.MONGODB_URI
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
const enigmaticSchema = new mongoose.Schema({
    discordID: String,
    cfHandle: String,
    solvedProblems: Array,
    solvedAssignments: Array,
    score: Number,
})
const assignmentSchema = new mongoose.Schema({
    problemIndex: String,
    problemPoints: Number
})
const Assignment = mongoose.model('Assignment', assignmentSchema)
const asgn = new Assignment({
    problemIndex: "1278B",
    problemPoints: 80
})
asgn.save().then(saved=>{
    console.log("Saved")
})
const Enigmatic = mongoose.model('Enigmatic', enigmaticSchema)
const user = new Enigmatic({
    discordID: "randoID",
    cfHandle: "randoCF",
    solvedProblems: [],
    solvedAssignments: [],
    score: 0
})
user.save().then(saved=>{
    console.log("Saved user")
})