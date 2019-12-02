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
module.exports = {
    Enigmatic: mongoose.model('Enigmatic', enigmaticSchema),
    Assignment: mongoose.model('Assignment', assignmentSchema)
}