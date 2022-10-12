import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(morgan('dev'));
dotenv.config();


app.set("PORT", process.env.PORT || 3000);

import taskRoutes from './routes/task.routes';

//MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '25mb' }));
app.use(cors());
app.use((req, send, next)=>{
    const replaceString = (object)=>{
        for (const key in object) {
            if (Object.hasOwnProperty.call(object, key)) {
                const element = object[key];
                typeof (element) == "object" && replaceString(element)
                typeof (element) == "string" && (object[key] = object[key].replace(/'/g, `''`))
            }
        }
    }
    replaceString(req.body);
    Math.round10 = function(num, decimalPlaces = 0){
        num = Math.round(num + "e" + decimalPlaces);
        return Number(num + "e" + -decimalPlaces);

    }
    next();
})


//ROUTES
app.use("/task/", taskRoutes);
app.use('/files', express.static(__dirname + "/files"))

app.get("/", (req, res) => {
    res.sendFile(`${__dirname}\\pages\\index.html`);
    
})


export default app