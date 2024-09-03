import { useEffect, useRef } from "react"
import { Socket } from "socket.io-client";
import { Terminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
const fitAddon = new FitAddon();

// xterm socket io Github used
function ab2str(buf: string) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

const OPTIONS_TERM = {
    useStyle: true,
    screenKeys: true,
    cursorBlink: true,
    cols: 200,
    theme: {
        background: "black"
    }
};
export const TerminalComponent = ({ socket }: {socket: Socket}) => {
    const terminalRef = useRef();

    useEffect(() => {
        if (!terminalRef || !terminalRef.current || !socket) {
            return;
        }

        const term = new Terminal(OPTIONS_TERM) // creating new terminal
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        socket.emit("requestTerminal"); //tell backedn that backend can start creating its own terminal

        socket.on("terminal", terminalHandler) // data from backend will be catch here
        function terminalHandler({ data }) {
            if (data instanceof ArrayBuffer) {
                console.error(data);
                console.log(ab2str(data))
                term.write(ab2str(data))
            }
        }
        // sending data to backend woh apne terminal pe yeh data run karega
        term.onData((data) => {
            // console.log(data);
            socket.emit('terminalData', {
                data
            });
        });
        
        // next line jana ho whenever useEffect start
        socket.emit('terminalData', {
            data: '\n'
        });

        // when this terminal component closes
        //socket close and send msg to backend to close its pseudo terminal
        return () => {
            socket.off("terminal")
        }
    }, [terminalRef]);

    return <div style={{width: "40vw", height: "400px", textAlign: "left"}} ref={terminalRef}>
        
    </div>
}