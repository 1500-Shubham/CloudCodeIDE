import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path";
import { pipeline, Readable } from 'stream';
import { Buffer } from 'buffer';

const s3 = new S3({
    accessKeyId: "50dffddf624ff1a6735ff7623596130e",
    secretAccessKey: "88d02674da7cf5f101e95b0bf51eb69d280f9ec2fe6ac924d31710bd5bfea138",
    endpoint: "https://d7a4c42a024029f72169ec6faf5cb79c.r2.cloudflarestorage.com"
})


export async function copyS3Folder(sourcePrefix: string,destinationPrefix: string){
    try {
        // List all objects in the source folder
        const listParams = {
            Bucket: "repl",
            Prefix: sourcePrefix
        };

        // all keys path are get for that source prefix
        const listedObjects = await s3.listObjectsV2(listParams).promise();
        

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;
        
        // Copy each object to the new location
        await Promise.all(listedObjects.Contents.map(async (object) => {
            if (!object.Key) return;
            // object key looks like /base/nodejs/index.ts from repl bucket
            // change /base/nodejs to /code/replID/index.ts 
            // now this bucket repl mein copy the same content file from source to destination
            // object key is /code/replID/index.ts 
            let destinationKey = object.Key.replace(sourcePrefix, destinationPrefix);
            let copyParams = {
                Bucket: "repl",
                CopySource: `repl/${object.Key}`, // copy source is content file acutal file is repl/base/nodejs/index.ts this content copied to
                Key: destinationKey // repl/code/replId/index.ts
            };

         

            // copies object/ actual file from CopySource to key 
            await s3.copyObject(copyParams).promise();
            // console.log(`Copied ${object.Key} to ${destinationKey}`);
        }));


    } catch (error) {
        console.error('Error copying folder:', error);
    }
}

export const fetchS3Folder = async (sourcePrefix: string, localPath: string): Promise<void> => {
    try {
        const params = {
            Bucket: "repl" ?? "",
            Prefix: sourcePrefix
        };

        // get all keys of that source prefix (code/${replId})
        //got all files key 
        const response = await s3.listObjectsV2(params).promise();

        if (response.Contents) {
            // Use Promise.all to run getObject operations in parallel
            await Promise.all(response.Contents.map(async (file) => {
                const fileKey = file.Key; // replID/src/index.ts file key example
                if (fileKey) {
                    const getObjectParams = {
                        Bucket: "repl" ?? "",
                        Key: fileKey
                    };

                    const data = await s3.getObject(getObjectParams).promise();
                    if (data.Body) {
                        const fileData = data.Body; //actual data from S3 of that file
                        const filePath = `${localPath}/${fileKey.replace(sourcePrefix, "")}`;
                        
                        let bufferData: Buffer;

                        if (Buffer.isBuffer(fileData)) {
                            bufferData = fileData;
                        } else if (fileData instanceof Readable) {
                            bufferData = await streamToBuffer(fileData);
                        } else {
                            throw new Error("Unexpected data.Body type");
                        }
                        
                        //  locally save  fileData on filePath 
                        await writeFile(filePath, bufferData);
                        // fileData is S3.Body need to convert it to Buffer for fs.write to use

                        // console.log(`Downloaded ${fileKey} to ${filePath}`);
                    }
                }
            }));
        }
    } catch (error) {
        console.error('Error fetching folder:', error);
    }
};
function writeFile(filePath: string, fileData: Buffer): Promise<void> {
    return new Promise(async (resolve, reject) => {
        await createFolder(path.dirname(filePath));

        fs.writeFile(filePath, fileData, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    });
}

function createFolder(dirName: string) {
    return new Promise<void>((resolve, reject) => {
        fs.mkdir(dirName, { recursive: true }, (err) => {
            if (err) {
                return reject(err)
            }
            resolve()
        });
    })
}

// CHATGPT -> converting data.Body (S3) into Buffer for writeFile
async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

export const saveToS3 = async (key: string, filePath: string, content: string): Promise<void> => {
    const params = {
        Bucket: "repl" ?? "",
        Key: `${key}${filePath}`,
        Body: content
    }

    await s3.putObject(params).promise()
}  