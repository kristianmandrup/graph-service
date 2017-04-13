![aither](https://github.com/hemerajs/aither/blob/master/logo.png?raw=true)
![aither](https://github.com/hemerajs/aither/blob/master/aither-stack.png?raw=true)
# aither

Aither shows an approach how to bootstrap a microservice system with [Hemera](https://github.com/hemerajs/hemera) and docker.
You can scale your worker in seconds and because we use NATS as “nervous system" for our distributed system we do not have to carry about service-discovery or load-balancing of hemera-services. We use traefik to load-balancing the api-gateway.

This configuration will setup:

* [Hapi](https://github.com/hapijs/hapi) http server which act as api-gateway to the Hemera services.
* [Microservice](https://github.com/hemerajs/aither/blob/master/worker/index.js) example which is responsible to add two numbers.
* [NATS](https://github.com/nats-io/gnatsd) server the underlying messaging system for Hemera.
* [Zipkin](http://zipkin.io/) dashboard to monitoring your distributed system.
* [Natsboard](https://github.com/devfacet/natsboard) dashboard to monitoring your NATS system in realtime.
* [Traefik](https://traefik.io/) modern HTTP reverse proxy and load balancer made to deploy microservices with ease.
* [Redis](https://redis.io) in memory cache for Hemera.

## Architecture

![aither](https://github.com/hemerajs/aither/blob/master/aither-architecture.png?raw=true)

## Running the system
```sh
docker-compose up
```

## Scaling the system
```
docker-compose scale worker=5 api=2
```

## Run load test

```
npm install -g artillery
artillery run loadtest.yml
```
Print the html artillery report with `artillery report <report.json>`

## Start a request against load balancer

Call the `Math` service, to concatenate/add two parameters `a` and `b`

```
http://localhost:8182/api/add?a=1&b=10
```

### Play with math

See `/play` folder for simple [hemera](https://hemerajs.github.io/hemera/getting-started.html) examples:

```js
hemera.ready(function () {

  // add service, listening to 'math' messages with command 'add'
  hemera.add({
    topic: "math",
    cmd: "add"
  }, function (req, cb) {
    // return result of adding a and b from request
    cb(null, req.a + req.b)
  })

  // make an action math.add with argument a: 1 and b: 2.
  // this add command message is sent on topic 'math'
  hemera.act({
    topic: "math",
    cmd: "add",
    a: 1,
    b: 2
  }, function (err, resp) {

    console.log("Result", resp)
  })
})
```

#### Run service

```
cd play
npm i
node math-service.js
```

#### Adding schema validation

See [payload validation](https://hemerajs.github.io/hemera/1_payload_validation.html) which uses [hemera-joi](https://github.com/hemerajs/hemera/tree/master/packages/hemera-joi)

```js
hemera.add({
  topic: "math",
  cmd: "add",
  a: Joi.number().required(),
  b: Joi.number().required()
  // ,maxMessages$: 1
}, function (req, cb) {
  cb(null, req.a + req.b)
})
```

You can also use `maxMessages$: 1` to only listen to one message, then unsubcribe.

#### Testing

See [hemera testing](https://hemerajs.github.io/hemera/5_testing.html)

```js
  // configure hemera and services
  // ...

  hemera.act({
    topic: "math",
    cmd: "add",
    a: 1,
    b: 2
  }, function (err, resp) {
    // do expectations on respnse (result) and any errors
    expect(err).to.be.not.exists()
    expect(resp).to.be.equals(3)

    // close hemera
    hemera.close()

    // notify async test completed
    done()
  })
```

#### Testing endpoints

- [Ava endpoint testing](https://github.com/avajs/ava/blob/master/docs/recipes/endpoint-testing.md)
- [Nock](https://github.com/node-nock/nock)
- [supertest](https://github.com/visionmedia/supertest)

#### Monitoring services

See [monitoring](https://hemerajs.github.io/hemera/6_monitoring.html)

#### hemera CLI

See [hemera-cli](https://github.com/hemerajs/hemera-cli)

```
npm install -g hemera-cli
hemera-cli
```

### Aither: Math service

Aither uses Hapi with Hemera. See `/math-service` folder:

* `add` will be the route on `/api`, ie. `/api/add`
* `a` and `b` will be numbers that are required (on validation).

Hemera uses [Hapi](https://hapijs.com/) Web server with [Validation](https://hapijs.com/tutorials/validation) using [Joi](https://github.com/hapijs/joi) Schemas and validation rules.

```js
  hemera.add({
    topic: 'math',
    cmd: 'add',
    a: Joi.number().required(),
    b: Joi.number().required(),
    refresh: Joi.boolean().default(false)
  }, function (req, cb) {
    // ...
    let operation = (a, b) => {
      return a + b
    }

    //big operation
    result = operation(req.a, req.b)
  })
```

This hemera service uses publish/subscribe via NATS. It is configured to listen/sends messages on the topic queue `math`.

#### Docker config

in `/math-service/Dockerfile` we:
- use the minimal node alpine image as baseline
- create a working dir `/usr/src/app`
- copy `package.json` into working dir
- run `npm install` to install all dependencies
- copy the service into working dir
- exectute the service via the command `node .` (ie. `node index.js`)

```yml
FROM node:7.4-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --production

# Bundle app source
COPY . /usr/src/app

CMD [ "node", "." ]
```

#### Docker composition

In `docker-compose.yml`

```yaml
  math-service:
    build:
      context: "./math-service"
    links:
      - nats
      - zipkin
    depends_on:
      - nats
      - redis
    restart: always
    environment:
      NATS_URL: nats://nats:4222
      NATS_USER: ruser
      NATS_PW: T0pS3cr3t
      ZIPKIN_URL: zipkin
      ZIPKIN_PORT: 9411
      HEMERA_LOG_LEVEL: silent
```

We build the service at `./math-service` with links to: `nats` and `zipkin`
and dependencies to services `nats` and `redis` (cache).
NATS is the messaging infrastructure for intra-service communication.

We then define some environment variables that are made available for the *math* service

### Graph service

See `/graph-service` folder

TODO

### Traefik dashboard

[http://localhost:8181/](http://localhost:8181/)

### NATS dashboard

[http://localhost:3000/](http://localhost:3000/)

### NATS monitoring endpoint

[http://localhost:8222/](http://localhost:8222/)

### Zipkin dashboard

[http://localhost:9411/](http://localhost:9411/)

## Example test on Digitalocean

* **Server**: 12 CPUs, 32GB RAM, 320GB SSD
* **Scaling**: 25 APIs, 100 workers
* **Load balancing**: Traefik in round-roubin for API services. NATS supports random only.
* **Caching**: No

#### Load-test:
* **Step-1**: Warm-up phase
Duration: 300 seconds
5 virtual users/second that last for 300 seconds

* **Step-2**: Daily business
Duration: 60 seconds
100 virtual users/second that last for 60 seconds

* **Step-3**: High load phase
Duration: 600 seconds
200 virtual users/second that last for 600 seconds

#### Result:
```
Complete report
  Scenarios launched:  126100
  Scenarios completed: 126100
  Requests completed:  126100
  RPS sent: 129.53
  Request latency:
    min: 3.8
    max: 736.9
    median: 6.9
    p95: 20.3
    p99: 63.2
  Scenario duration:
    min: 4.5
    max: 738.4
    median: 7.7
    p95: 21.3
    p99: 64.3
  Scenario counts:
    0: 126100 (100%)
  Codes:
    200: 126100
```

The full report you can find [here.](https://github.com/hemerajs/aither/tree/master/digitalocean-report)

## Thank you
thanks most of all to the community who create these awesome opensource software and thereby making it possible.
