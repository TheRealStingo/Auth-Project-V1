const bodyParser = require("body-parser")
const { prototype } = require("events")
const express = require("express")
const app = express()
const ROUTES= require("./auth-api/routers/routes")
const cors = require("cors")
const PORT = 300
const connectDB = require("./db/connect")


app.use(bodyParser.json())
app.use(cors({origin:"*"}))
app.set('trust proxy', true)


app.use("/api",ROUTES)




connectDB().then(()=>{
    console.log("DB Ready to work")
    app.listen(PORT,()=>console.log("all good"))
})
.catch(err=>console.log(err))

