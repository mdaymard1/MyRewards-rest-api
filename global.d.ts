import { Environment } from 'square';

namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    HOST: string;
    DATABASE: string;
    DBHOST: string;
    DBPORT: string;
    USERNAME: string;
    PASSWORD: string;
    MERCHANT_HOST_NAME: string;
    NODE_ENV: Environment;
  }
}
