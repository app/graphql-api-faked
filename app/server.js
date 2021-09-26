import express from 'express'
import cors from 'cors'
import ejwt from 'express-jwt'
import { graphqlHTTP } from 'express-graphql'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import expressPlayground from 'graphql-playground-middleware-express'
import auth from 'auth'

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || '3080'
const protocol = process.env.NODE_ENV === 'development' ? "http" : "https"
const endpoint = process.env.NODE_ENV === 'development' ?
  `${protocol}://127.0.0.1:${port}/graphql` : `${protocol}://graphql-api-faked.vercel.app/graphql`

const typeDefs = mergeTypeDefs([
  'scalar JSON',
  auth.typeDefs,
]);

const resolvers = [
  auth.resolvers,
];

const schema = makeExecutableSchema({ typeDefs, resolvers })

const app = express()
const whiteList = ['http://localhost','*']
const corsOptions = {
  origin: (origin, callback) =>  callback(null, whiteList.includes('*') || whiteList.includes(origin)),
  credentials: true,
}
app.use( cors(corsOptions),)

app.get('/', (req, res) => res.send(`
  <body style="color:rgb(42, 126, 211);background-color:#172a3a">
    <h1>GraphQL faked API</h1>
    <div>&nbsp;</div>
    <p>
      Try <a style="color:rgb(42, 126, 211)" href="/playground">GraphQL Web playground</a> 
    </p>
    <p>
      Use ${protocol}://${req.host}/graphql as graphql endpoint in your client API.
    </p>
  </body>

`));

app.use(
  ejwt(
    {
      secret:auth.secret,
      algorithms: ['HS256']
    }
  )
    .unless({path: ['/graphql','/playground']})
)

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('Invalid  or missing token');
  }
  next()
});

app.get('/user', (req, res) => res.send(`
  <h1>User's account</h1>
  <div>&nbsp;</div>
  <p>
    ${req.user}
  </p>
`))

app.get(
  '/playground',
  expressPlayground.default({
    // endpoint: `http://127.0.0.1:${port}/graphql`,
    endpoint,
  }),
)

app.use('/graphql', graphqlHTTP( async (req) => {
  var token = req.header('Authorization')
  token = token ? token.replace(/^.*\s+/, "") : token
  const context = { req, token }
  return {
    schema: schema,
    graphiql: true,
    context,
  }
}))
app.listen(port, host, () => console.log(`Node.js API server is listening on http://127.0.0.1:${port}/graphql`))
