"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyS3Folder = void 0;
const aws_sdk_1 = require("aws-sdk");
const s3 = new aws_sdk_1.S3({
    accessKeyId: "50dffddf624ff1a6735ff7623596130e",
    secretAccessKey: "88d02674da7cf5f101e95b0bf51eb69d280f9ec2fe6ac924d31710bd5bfea138",
    endpoint: "https://d7a4c42a024029f72169ec6faf5cb79c.r2.cloudflarestorage.com"
});
function copyS3Folder(sourcePrefix, destinationPrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // List all objects in the source folder
            const listParams = {
                Bucket: "repl",
                Prefix: sourcePrefix
            };
            // all keys path are get for that source prefix
            const listedObjects = yield s3.listObjectsV2(listParams).promise();
            if (!listedObjects.Contents || listedObjects.Contents.length === 0)
                return;
            // Copy each object to the new location
            yield Promise.all(listedObjects.Contents.map((object) => __awaiter(this, void 0, void 0, function* () {
                if (!object.Key)
                    return;
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
                console.log(copyParams);
                yield s3.copyObject(copyParams).promise();
                console.log(`Copied ${object.Key} to ${destinationKey}`);
            })));
        }
        catch (error) {
            console.error('Error copying folder:', error);
        }
    });
}
exports.copyS3Folder = copyS3Folder;
