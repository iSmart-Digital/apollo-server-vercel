import corsMiddleware from 'cors';
import {
    GraphQLOptions,
    ApolloServerBase,
    Config,
    runHttpQuery,
    convertNodeHttpToRequest,
    isHttpQueryError,
} from 'apollo-server-core';
import accepts from 'accepts';
import type { NextApiRequest, NextApiResponse } from 'next';

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result);
            }

            return resolve(result);
        });
    });
};

const prefersHtml = (req: NextApiRequest): boolean => {
    if (req.method !== 'GET') {
        return false;
    }
    const accept = accepts(req);
    const types = accept.types() as string[];
    return (
        types.find((x: string) => x === 'text/html' || x === 'application/json') ===
        'text/html'
    );
};

export interface VercelContext {
    req: NextApiRequest;
    res: NextApiResponse<any>;
}

export interface GetHandler {
    cors?:
    | corsMiddleware.CorsOptions
    | corsMiddleware.CorsOptionsDelegate
    | boolean;
}

export type ApolloServerVercelConfig = Config<VercelContext>;

type handler = (req: NextApiRequest, res: NextApiResponse) => void;

export class ApolloServer extends ApolloServerBase {

    protected override serverlessFramework(): boolean {
        return true;
    }
    
    async createGraphQLServerOptions(
        req: NextApiRequest,
        res: NextApiResponse,
    ): Promise<GraphQLOptions> {
        return super.graphQLServerOptions({ req, res });
    }

    public getHandler = ({ cors }: GetHandler): handler => {
        return (req: NextApiRequest, res: NextApiResponse) => {
            return new Promise<void>((resolve, reject) => {
                (async () => {
                    //initialize cors if needed
                    if (cors && typeof cors != 'boolean') {
                        await runMiddleware(req, res, corsMiddleware(cors));
                    } else if (cors) {
                        await runMiddleware(req, res, corsMiddleware());
                    }

                    const landingPage = this.getLandingPage();
                    if (landingPage && prefersHtml(req)) {
                        res.setHeader('Content-Type', 'text/html');
                        res.write(landingPage.html);
                        res.end();
                        resolve();
                        return;
                    }

                    if (!req.body) {
                        // The json body-parser *always* sets req.body to {} if it's unset (even
                        // if the Content-Type doesn't match), so if it isn't set, you probably
                        // forgot to set up body-parser.
                        res.status(500);
                        res.send('no body available');
                        resolve();
                        return;
                    }

                    runHttpQuery([], {
                        method: req.method || 'GET',
                        options: () => this.createGraphQLServerOptions(req, res),
                        query: req.method === 'POST' ? req.body : req.query,
                        request: convertNodeHttpToRequest(req),
                    }).then(
                        ({ graphqlResponse, responseInit }) => {
                            if (responseInit.headers) {
                                for (const [name, value] of Object.entries(
                                    responseInit.headers
                                )) {
                                    res.setHeader(name, value);
                                }
                            }

                            res.statusCode = responseInit.status || 200;

                            // Using `.send` is a best practice for Express, but we also just use
                            // `.end` for compatibility with `connect`.
                            if (typeof res.send === 'function') {
                                res.send(graphqlResponse);
                            } else {
                                res.end(graphqlResponse);
                            }
                            resolve();
                            return;
                        },
                        (error: Error) => {
                            if (isHttpQueryError(error)) {
                                if (error.headers) {
                                    for (const [name, value] of Object.entries(error.headers)) {
                                        res.setHeader(name, value);
                                    }
                                }
                                res.statusCode = error.statusCode;
                                if (typeof res.send === 'function') {
                                    res.send(error.message);
                                } else {
                                    res.end(error.message);
                                }
                            } else {
                                res.statusCode = 500;
                                if (typeof res.send === 'function') {
                                    res.send(error.message);
                                } else {
                                    res.end(error.message);
                                }
                            }
                            resolve();
                            return;
                        }
                    );
                })();
            });
        };
    };
}
