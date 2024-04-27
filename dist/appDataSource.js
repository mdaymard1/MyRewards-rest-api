"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
// import env from 'server/env';
// import { entities, migrations } from './typeOrmInit';
/**
 * A globally accessible Data Source instance (initialized in server.js) to be used
 * across the app (e.g. to execute various database operations)
 */
exports.AppDataSource = new typeorm_1.DataSource({
    // @ts-ignore - string does not match DataSourceOptions["type"] type
    type: "postgres",
    host: process.env.DBHOST,
    port: parseInt(process.env.DBPORT || "5432"),
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    // database: process.env.DATABASE,
    entities: ["dist/src/entity/*.{js,ts}"],
    // migrations,
    logging: true,
    synchronize: true,
    // migrationsRun: env.typeOrmAutoMigrate,
    // extra: env.typeOrmDriverExtra
    //   ? JSON.parse(env.typeOrmDriverExtra)
    //   : undefined,
    // host: 'localhost',
    // port: 5432,
    // username: 'admin',
    // password: 'myrewards',
    database: "postgres",
    // database: "rewards",
    // database: "my_rewards_prod",
});
