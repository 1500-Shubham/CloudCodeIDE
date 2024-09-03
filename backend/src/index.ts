import express from "express";
import dotenv from "dotenv"
import { initHttp } from "./http"; // all my http api will be passed inside this
import { createServer } from "http";
import cors from "cors";
import { initWs } from "./ws";
dotenv.config()



const app = express();
app.use(cors());
// Created http server will be used in websocket 
const httpServer = createServer(app);
initHttp(app); // passed app for api creatinon
initWs(httpServer); //passed for io connection


// directly listening on httpServer
httpServer.listen(3000, () => {
    console.log(`listening on 3000}`);
  });