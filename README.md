# Apollo Server integration for Vercel Serverless functions

The easiest way to deploy an Apollo GraphQL API to Vercel Serverless functions using Next.JS API Routes.

## Usage

```node
import { typeDefs, Query, Mutation, Models, createContext } from './graphql';
import { makeExecutableSchema } from "@graphql-tools/schema";
import { merge } from "lodash";
import { ApolloServer, VercelContext } from "@ismart-digital/apollo-server-vercel";

let schema = makeExecutableSchema({
    typeDefs: [
        ...typeDefs,
    ],
    resolvers: merge({}, { Query: Query }, { Mutation: Mutation }, Models),
})

let server = new ApolloServer({
    schema,
    context: (ctx: VercelContext) => createContext(ctx.req.headers.authorization || ""),
});

export default server.getHandler({ cors: true });
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## Usage

This package is mainly used for internal use and is not activly maintained at this moment.