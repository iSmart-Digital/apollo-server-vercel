import corsMiddleware from 'cors';
import { GraphQLOptions, ApolloServerBase, Config } from 'apollo-server-core';
import type { NextApiRequest, NextApiResponse } from 'next';
export interface VercelContext {
    req: NextApiRequest;
    res: NextApiResponse<any>;
}
export interface GetHandler {
    cors?: corsMiddleware.CorsOptions | corsMiddleware.CorsOptionsDelegate | boolean;
}
export declare type ApolloServerVercelConfig = Config<VercelContext>;
declare type handler = (req: NextApiRequest, res: NextApiResponse) => void;
export declare class ApolloServer extends ApolloServerBase {
    protected serverlessFramework(): boolean;
    createGraphQLServerOptions(req: NextApiRequest, res: NextApiResponse): Promise<GraphQLOptions>;
    getHandler: ({ cors }: GetHandler) => handler;
}
export {};
