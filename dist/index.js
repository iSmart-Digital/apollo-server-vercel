"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApolloServer = void 0;
const cors_1 = __importDefault(require("cors"));
const apollo_server_core_1 = require("apollo-server-core");
const accepts_1 = __importDefault(require("accepts"));
// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
const runMiddleware = (req, res, fn) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
};
const prefersHtml = (req) => {
    if (req.method !== 'GET') {
        return false;
    }
    const accept = (0, accepts_1.default)(req);
    const types = accept.types();
    return (types.find((x) => x === 'text/html' || x === 'application/json') ===
        'text/html');
};
class ApolloServer extends apollo_server_core_1.ApolloServerBase {
    constructor() {
        super(...arguments);
        this.getHandler = ({ cors }) => {
            return (req, res) => {
                return new Promise((resolve, reject) => {
                    (() => __awaiter(this, void 0, void 0, function* () {
                        //initialize cors if needed
                        if (cors && typeof cors != 'boolean') {
                            yield runMiddleware(req, res, (0, cors_1.default)(cors));
                        }
                        else if (cors) {
                            yield runMiddleware(req, res, (0, cors_1.default)());
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
                        (0, apollo_server_core_1.runHttpQuery)([], {
                            method: req.method || 'GET',
                            options: () => this.createGraphQLServerOptions(req, res),
                            query: req.method === 'POST' ? req.body : req.query,
                            request: (0, apollo_server_core_1.convertNodeHttpToRequest)(req),
                        }).then(({ graphqlResponse, responseInit }) => {
                            if (responseInit.headers) {
                                for (const [name, value] of Object.entries(responseInit.headers)) {
                                    res.setHeader(name, value);
                                }
                            }
                            res.statusCode = responseInit.status || 200;
                            // Using `.send` is a best practice for Express, but we also just use
                            // `.end` for compatibility with `connect`.
                            if (typeof res.send === 'function') {
                                res.send(graphqlResponse);
                            }
                            else {
                                res.end(graphqlResponse);
                            }
                            resolve();
                            return;
                        }, (error) => {
                            if ((0, apollo_server_core_1.isHttpQueryError)(error)) {
                                if (error.headers) {
                                    for (const [name, value] of Object.entries(error.headers)) {
                                        res.setHeader(name, value);
                                    }
                                }
                                res.statusCode = error.statusCode;
                                if (typeof res.send === 'function') {
                                    res.send(error.message);
                                }
                                else {
                                    res.end(error.message);
                                }
                            }
                            else {
                                res.statusCode = 500;
                                if (typeof res.send === 'function') {
                                    res.send(error.message);
                                }
                                else {
                                    res.end(error.message);
                                }
                            }
                            resolve();
                            return;
                        });
                    }))();
                });
            };
        };
    }
    serverlessFramework() {
        return true;
    }
    createGraphQLServerOptions(req, res) {
        const _super = Object.create(null, {
            graphQLServerOptions: { get: () => super.graphQLServerOptions }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.graphQLServerOptions.call(this, { req, res });
        });
    }
}
exports.ApolloServer = ApolloServer;
//# sourceMappingURL=index.js.map