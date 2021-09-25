import express from 'express'
import cors from 'cors'
import { graphqlHTTP } from 'express-graphql'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import auth from 'auth'

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || '3080'

const typeDefs = mergeTypeDefs([
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

app.use('/graphql', graphqlHTTP( async (req) => {
  const context = { req }
  return {
    schema: schema,
    graphiql: true,
    context,
  }
}))
app.listen(port, host, () => console.log(`Node.js API server is listening on http://${host}:${port}/graphql`))
