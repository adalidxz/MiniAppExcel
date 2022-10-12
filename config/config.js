const dotenv = require("dotenv");
dotenv.config();

export const config = {
        user: process.env.SQL_USERNAME,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DATABASE,
        server: process.env.SQL_SERVER,
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
        options: {
            enableArithAbort:true,
            cryptoCredentialsDetails: {
                minVersion: 'TLSv1'
            },
            encrypt: false, // for azure
            trustServerCertificate: false // change to true for local dev / self-signed certs
        }

}