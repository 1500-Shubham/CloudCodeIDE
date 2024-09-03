import { Express } from "express";
import { copyS3Folder } from "./aws";
import express from "express";

// passed the app created by Express 
export function initHttp(app: Express) {
    app.use(express.json()); // attached express json cna be body 

    app.post("/project", async (req, res) => {

        const { replId, language } = req.body;

        if (!replId) {
            res.status(400).send("Bad request");
            return;
        }
        // copy from and to new place on S3 without saving to local 
        await copyS3Folder(`base/${language}`, `code/${replId}`);

        res.send("Project created");
    });
}