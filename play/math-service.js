const Hemera = require("nats-hemera")
const nats = require("nats").connect()

const hemera = new Hemera(nats, {
  logLevel: "info"
})

hemera.ready(function () {

  hemera.add({
    topic: "math",
    cmd: "add"
  }, function (resp, cb) {

    cb(null, resp.a + resp.b)
  })

  hemera.act({
    topic: "math",
    cmd: "add",
    a: 1,
    b: 2
  }, function (err, resp) {

    console.log("Result", resp)
  })
})