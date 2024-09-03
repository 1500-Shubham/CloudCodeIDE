import { Server as HttpServer } from "http"; //HttpServer name changed 
import { Server, Socket } from "socket.io";
import path from "path";
import { fetchS3Folder, saveToS3 } from "./aws";
import { fetchDir,fetchFileContent,saveFile } from "./fs";
import { TerminalManager } from "./pty";

const terminalManager = new TerminalManager();

export function initWs(httpServer: HttpServer) {
// initialise io connection and socket setup
const io = new Server(httpServer, {
    cors: {
        // Can restrict this more!
        origin: "*",
        methods: ["GET", "POST"],
    },
});
io.on("connection", async (socket) => {
    // Auth checks should happen here
    // this replId is passed with io(url+query) in frontend extracting that value
    var replId = socket.handshake.query.roomId as string;

    if (!replId) {
        socket.disconnect();
        return;
    }

    await fetchS3Folder(`code/${replId}`, path.join(__dirname, `../tmp/${replId}`));
    socket.emit("loaded", {
        rootContent: await fetchDir(path.join(__dirname, `../tmp/${replId}`), "")
        // fetch dir only upper layerread not actual data within file
    });

    // All other handlers declare now Step 11
    initHandlers(socket, replId);

});

function initHandlers(socket: Socket, replId: string) {

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });

    socket.on("fetchDir", async (dir: string, callback) => {
        const dirPath = path.join(__dirname, `../tmp/${replId}/${dir}`);
        const contents = await fetchDir(dirPath, dir);
        callback(contents);
    });
    // actutl data read fs.readFile uses
    socket.on("fetchContent", async ({ path: filePath }: { path: string }, callback) => {
        const fullPath = path.join(__dirname, `../tmp/${replId}/${filePath}`);
        const data = await fetchFileContent(fullPath);
        callback(data); // will be use by frontend emit 
    });

    // update the changed content locally and s3 with given filePath
    socket.on("updateContent", async ({ path: filePath, content }: { path: string, content: string }) => {
        const fullPath = path.join(__dirname, `../tmp/${replId}/${filePath}`);
        await saveFile(fullPath, content);
        await saveToS3(`code/${replId}`, filePath, content);
    });

    socket.on("requestTerminal", async () => {
        // thjis (data,id) is passed inside createPty jaise term on data ready yeh call hota 
        terminalManager.createPty(socket.id, replId, (data, id) => {
            socket.emit('terminal', {
                data: Buffer.from(data,"utf-8")
            });
        });
    });
    
    socket.on("terminalData", async ({ data }: { data: string, terminalId: number }) => {
        terminalManager.write(socket.id, data);
    });


}
}