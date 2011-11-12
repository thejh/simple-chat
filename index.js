var express = require('express')
var app = express.createServer()
app.use(express.static(__dirname+'/public/'))

app.listen(80)

var dnode = require('dnode')

var users = []
var server = dnode(function(remote, conn) {
  var that = this
  this.remote = remote
  users.push(this)
  conn.on('end', function() {
    if (that.name) {
      broadcast('SYSTEM', that.name+' has quit')
    }
    removeFromArray(users, that)
  })
  return {
    login: function(name, cb) {
      if (that.name) return
      name = name.toLowerCase().replace(/[^a-z]/g, '')
      if (name.length<1 || users.some(function(user) {
        return user.name === name
      })) {
        return cb(false, 'name in use')
      }
      that.name = name
      cb(true, 'unused username allocated for you')
      broadcast('SYSTEM', 'user joined: '+name)
    }
  , say: function(text) {
      if (!that.name) return
      broadcast(that.name, text)
    }
  }
})
server.listen(app)

function broadcast(senderName, text) {
  users.forEach(function(user) {
    if (typeof user.remote.show === 'function') {
      user.remote.show(senderName, text)
      console.log('broadcasting to '+user.name)
    } else {
      console.log('not broadcasting to '+user.name+': '+Object.keys(user.remote).join(','))
    }
  })
}

function removeFromArray(arr, e) {
  var i = arr.indexOf(e)
  if (i<0) throw new Error("404")
  arr.splice(i, 1)
}
