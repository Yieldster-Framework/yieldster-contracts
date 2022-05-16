exports.to18 = ((n) => {
    return web3.utils.toWei(n, "ether");
})

exports.from18 = (n => {
    return web3.utils.fromWei(n, "ether");
})

exports.to6 = (n => {
    return web3.utils.toWei(n, "Mwei");
})

exports.from6 = (n => {
    return web3.utils.fromWei(n, "Mwei");
})