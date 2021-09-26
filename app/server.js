import express from 'express'
import cors from 'cors'
import ejwt from 'express-jwt'
import { graphqlHTTP } from 'express-graphql'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import auth from 'auth'

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || '3080'

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
  <h1>GraphQL faked API</h1>
  <div>&nbsp;</div>
  <p>
    Try <a href="/graphql">/graphql</a>
  </p>
`));

app.use(
  ejwt(
    {
      secret:auth.secret,
      algorithms: ['HS256']
    }
  )
    .unless({path: ['/graphql']})
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
app.listen(port, host, () => console.log(`Node.js API server is listening on http://${host}:${port}/graphql`))
