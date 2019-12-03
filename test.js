var list = [{
    score : 10,
    solved : 20
}, {
    score : 10,
    solved : 30,
}, {
    score :30,
    solved : 10,
}, {
    score :5,
    solved : 500
}]
list.sort((a, b) => {
    if(a.score > b.score)
        return true;
    else if(a.score === b.score && a.solved > b.solved)
        return true;
    return false;
})
console.log(list)