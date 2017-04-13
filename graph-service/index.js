const Hemera = require('nats-hemera')
const HemeraJoi = require('hemera-joi')
const HemeraZipkin = require('hemera-zipkin')
const nats = require('nats').connect({
  'url': process.env.NATS_URL,
  'user': process.env.NATS_USER,
  'pass': process.env.NATS_PW
})

const hemera = new Hemera(nats, {
  logLevel: process.env.HEMERA_LOG_LEVEL
})

hemera.use(HemeraJoi)
hemera.use(HemeraZipkin, {
  host: process.env.ZIPKIN_URL,
  port: process.env.ZIPKIN_PORT
})

hemera.ready(() => {
  let Joi = hemera.exposition['hemera-joi'].joi

  // See: https://github.com/hapijs/joi
  hemera.add({
    topic: 'graph',
    cmd: 'toYaml',
    graph: Joi.object().required(),
    name: Joi.string().required(),
    refresh: Joi.boolean().default(false)
  }, function (req, cb) {

    let hashkey = 1 // TODO: md5 hashkey on JSON.stringify(req.graph)
    let key = `graph:toYaml_${req.name}_${hashkey}`
    let ma = this
    let result

    // TODO: convert graph to YAML
    let toYaml = (graph) => {
      return 'yaml'
    }

    // no cache
    if (req.refresh) {

      //big operation
      result = operation(req.graph)

      // update cache
      this.act({
        topic: 'redis-cache',
        cmd: 'set',
        key: key,
        value: result
      })

      return cb(null, result)

    } else {

      // check cache
      this.act({
        topic: 'redis-cache',
        cmd: 'get',
        key: key
      }, function (err, resp) {

        if (err) {

          return cb(err)
        }

        if (resp) {

          // mark this request as cached for zipkin
          ma.delegate$.cache = 'Redis:HIT'

          return cb(null, resp)
        }

        //big operation
        result = operation(req.a, req.b)

        // update cache
        this.act({
          topic: 'redis-cache',
          cmd: 'set',
          key: key,
          value: result
        })

        cb(null, result)

      })

    }

  })
})