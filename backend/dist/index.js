"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("./http"); // all my http api will be passed inside this
const http_2 = require("http");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Created http server will be used in websocket 
const httpServer = (0, http_2.createServer)(app);
(0, http_1.initHttp)(app); // passed app for api creatinon
// directly listening on httpServer
httpServer.listen(3000, () => {
    console.log(`listening on 3000}`);
});
