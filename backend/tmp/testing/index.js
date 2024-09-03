const express = require("express");
const app = express();

app.get("/",(req,res)=>{
    res.send("Hi App")
})

app.listen(3001,()=>{
    console.log("Listening")
});