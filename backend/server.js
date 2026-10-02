const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");

const dbString = process.env.DB_URL.replace(
    "<db_password>",
    process.env.DB_PASSWORD,
);

const port = process.env.PORT;

mongoose
    .connect(dbString)
    .then(() => {
        console.log("Database connection successful");

        const server = app.listen(port, () => {
            console.log(
                `WordWise is runnning at port ${port} in ${process.env.NODE_ENV} mode`,
            );
        });

        process.on("unhandledRejection", (err) => {
            console.log(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        });
    })
    .catch((err) => console.log(err));
