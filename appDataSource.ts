import { DataSource } from "typeorm";
// import env from 'server/env';
// import { entities, migrations } from './typeOrmInit';

/**
 * A globally accessible Data Source instance (initialized in server.js) to be used
 * across the app (e.g. to execute various database operations)
 */
export const AppDataSource = new DataSource({
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

  // Production:
  database: "postgres",

  // Local:
  // database: "rewards",

  // database: "my_rewards_prod",
});
