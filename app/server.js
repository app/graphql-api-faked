import express from 'express'
import cors from 'cors'
import { graphqlHTTP } from 'express-graphql'
import { makeExecutableSchema }  from 'graphql-tools'
import auth from 'auth'

const host = '0.0.0.0'
const port = '3080'

const typeDefs = `
  ${(auth.schema.Type || '')}
  type Query {
    ${auth.schema.Query}
  }
  type Mutation {
    placeHolder: Int
    ${(auth.schema.Mutation || '')}
  }
`

var resolvers = {
  Query: {
    ...auth.resolvers.Query,
  },
  Mutation: {
    placeHolder: () => 0,
    ...auth.resolvers.Mutation,
  },
  ...auth.resolvers.Custom
}

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
