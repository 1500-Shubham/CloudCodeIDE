import { useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { File, RemoteFile, Type } from './external/editor/utils/file-manager';
import { Editor } from './Editor';
import { Output } from './Output';
import { TerminalComponent } from './Terminal';

// sytling div with defined names as Container ButtonContainer etc
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end; /* Aligns children (button) to the right */
  padding: 10px; /* Adds some space around the button */
`;

const Workspace = styled.div`
  display: flex;
  margin: 0;
  font-size: 16px;
  width: 100%;
`;

const LeftPanel = styled.div`
  flex: 1;
  width: 60%;
`;

const RightPanel = styled.div`
  flex: 1;
  width: 40%;
`;

// whenever replId pass it gives a socket connecting backend 
function useSocket(replId: string) {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(`http://localhost:3000?roomId=${replId}`); //backend will extract replID
        // now io connection is succesfull
        setSocket(newSocket);

        // Clean up the effect when the component unmounts toh us time socket connection disconnect kar denge
        return () => {
            newSocket.disconnect();
        };
    }, [replId]);

    return socket;
}
const CodingPage = () => {
    const [searchParams] = useSearchParams(); //http://localhost:5173/coding/?replId=doginsideinside
    const replId = searchParams.get('replId') ?? ''; //extract query parameter from url
    const socket= useSocket(replId); // now this socket is universal
    const [loaded, setLoaded] = useState(false); //if socket.loaded then true
    const [fileStructure, setFileStructure] = useState<RemoteFile[]>([]); //***all files get from socket.load save here
    const [showOutput, setShowOutput] = useState(false); //for output window
    
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
    // this will be used inside code window 
    
    // this method is passed along with code editor whenever file select DIR | FILE  use this for onClick
    const onSelect = (file: File) => {
      if (file.type === Type.DIRECTORY) {
          socket?.emit("fetchDir", file.path, (data: RemoteFile[]) => {
              setFileStructure(prev => {
                  const allFiles = [...prev, ...data];
                  return allFiles.filter((file, index, self) => 
                      index === self.findIndex(f => f.path === file.path)
                  );
              });
          });

      } else {
          socket?.emit("fetchContent", { path: file.path }, (data: string) => {
              file.content = data;
              //  string passed from backend fs.readFile on this path 
              // update the file passed
              setSelectedFile(file); //use by code window
              // callback(data) socket andar karoge woh yaha aa jayega 
          });
      }
  };

    useEffect(() => {
        if (socket) {
            socket.on('loaded', ({ rootContent }: { rootContent: RemoteFile[]}) => {
                setLoaded(true);
                setFileStructure(rootContent);
            });
            //root Content is array of json => RemoteFile
               //{type: 'file', name: 'index.js', path: '/index.js'}
              // 1
              // {type: 'dir', name: 'CheckDir', path: '/CheckDir'}
              // : 
              // {type: 'file', name: 'package-lock.json', path: '/package-lock.json'}

        }
    }, [socket]);

    if (!loaded) {
      return "Loading...";
    }

  return (
    <Container>
    <ButtonContainer>
       <button onClick={() => setShowOutput(!showOutput)}>See output</button>
   </ButtonContainer>
   <Workspace>
       <LeftPanel>
           <Editor socket={socket} selectedFile={selectedFile} onSelect={onSelect} files={fileStructure} />
       </LeftPanel>
       <RightPanel>
           {showOutput && (<Output/>)}
           <TerminalComponent socket={socket} />
       </RightPanel>
   </Workspace>
</Container>
  )
}

export default CodingPage
