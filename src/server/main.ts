import * as express from "express";
import * as Path from "path";
import * as FS from "fs";
import {createConnection, TableForeignKey} from "typeorm";
import * as Util from "util";
import { Tag, Document, Meta, Namespace, MetaData } from "./entities";
import * as JOI from "joi";
import * as bodyParser from "body-parser";
import * as Multer from "multer";

const dataPath = Path.join(__dirname, "..", "..");
const uploadPath = Path.join(dataPath, "uploads");
const filePath = Path.join(dataPath, "files");

const assetsPath = Path.join(__dirname, "..", "..", "dist", "public");
const jsonParser = bodyParser.json();
const upload = Multer({dest: uploadPath})

async function init(){
    try{
        await Util.promisify(FS.mkdir)(filePath);
    }catch(e){}
    try{
        await Util.promisify(FS.mkdir)(uploadPath);
    }catch(e){}
    const db = await createConnection({
        type: "sqlite", 
        database: Path.join(dataPath, "db.sqlite"),
        synchronize: true,
        entities: [Tag, Document, Meta, Namespace, MetaData]
    });

    // Initialize db
    let metas = [
        {id: "received", title: "Empfangen", 
        deleteable: false, isArray: false,
        optional: true, type: "date"}
    ];
    try{
        Promise.all(metas.map(m=>{
            let add = new Meta();
            for(let p in m)
                (add as any)[p] = (m as any)[p];
            return add.save();
        }));
    }catch(e){}


    const app = express();
    await new Promise((res,rej)=>app.listen(3000, ()=>res()));

    app.get("/ui*", async (req, res)=>{
        res.sendFile(Path.join(assetsPath, "index.html"));
    })
    app.get("/assets/:path", async (req, res)=>{
        if(req.params.path.indexOf("/") > -1)
            res.status(422);
        else
            res.sendFile(Path.join(assetsPath, req.params.path));
    })

    // Meta get, delete, add
    app.get('/api/metas', async (req, res)=>{
        let metas = await Meta.find();
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(metas));
        res.end();
    });
    app.delete('/api/metas/:meta', async (req, res)=>{
        let meta = await Meta.find({id: req.params.meta});
        if(meta.length == 0){
            res.status(404).send("Meta not found");
        }else if(!meta[0].deleteable){
            res.status(403).send("Meta is not deleteable");
        }else{
            await meta[0].remove();
            res.status(200);
        }
        res.end();
    });
    app.post('/api/metas', jsonParser, async (req, res)=>{
        if(req.header("Content-Type") != "application/json"){
            res.status(422).send("Expecting json body!");
            return;
        }
        let {value: {id, title, isArray, optional, type}, 
            error} = JOI.object({
            id: JOI.string().min(1).max(20)
                .regex(/[a-z0-9]+/).required(), 
            title: JOI.string().min(1).required(), 
            isArray: JOI.bool().required(),
            optional: JOI.bool().required(),
            type: JOI.string().allow([
                "date","string","uint","int","decimal"
            ]).required()
        }).validate(req.body);
        if(error){
            res.status(422).send(error.message);
            return;
        }
        let meta = new Meta();
        meta.id = id;
        meta.title = title;
        meta.isArray = isArray;
        meta.deleteable = true;
        meta.type = type;
        meta.optional = optional;
        await meta.save();
        res.end();
    })

    // Tags get, delete, add
    app.get('/api/tags', async (req, res)=>{
        let tags = await Tag.find();
        tags.map( t=>({name: t.id, title: t.title}) )
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(tags));
        res.end();
    });
    app.delete('/api/tags/:tag', async (req, res)=>{
        let tags = await Tag.find({id: req.params.tag});
        if(tags.length == 0){
            res.status(404).send("Tag not found");
        }else{
            await tags[0].remove();
            res.status(200);
        }
        res.end();
    });
    app.post('/api/tags', jsonParser, async (req, res)=>{
        if(req.header("Content-Type") != "application/json"){
            res.status(422).send("Expecting json body!");
            return;
        }
        let {value, error} = JOI.object({
            "id": JOI.string().min(1).max(20)
                .regex(/[a-z0-9]+/).required(),
            "title": JOI.string().min(1).required()
        }).validate(req.body);
        if(error){
            res.status(422).send(error.message);
            return;
        }
        let tag = new Tag();
        tag.id = value.id;
        tag.title = value.title;
        await tag.save();
        res.end();
    })
    app.get('/api/dates', async (req, res)=>{
        let tags = await Tag.find();
        tags.map( t=>({name: t.id, title: t.title}) )
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(tags));
        res.end();
    });

    // Document methods
    app.get("/api/docs", async (req, res)=>{
        let docs = await Document.find();
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(docs));
        res.end();
    })
    app.get("/api/docs/:uuid", async (req, res)=>{
        let docs = await Document.find({uuid: req.params.uuid});
        if(docs.length == 0){
            res.status(404).end()
        }else{
            res.setHeader("Content-Type", "application/json");
            res.send(JSON.stringify(docs[0]));
            res.end();
        }
    })
    app.post("/api/docs/new", upload.single("file"), async (req, res)=>{
        let now = new Date();
        let doc = new Document();
        doc.filetype = Path.extname(req.file.originalname).substr(1);
        doc.title = req.file.originalname;
        doc.origFilename = req.file.originalname;
        doc.added = now;
        doc.autoKeywords = [];
        doc.customKeywords = [];
        doc.documentDate = now;
        doc.modified = now;
        await doc.save();
        await Util.promisify(FS.rename)(req.file.path, Path.join(filePath, doc.filename));
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(doc));
        res.end();
    })
    app.delete("/api/docs/:uuid", async (req,res)=>{
        let docs = await Document.find({uuid: req.params.uuid});
        if(docs.length == 0){
            res.status(404).end();
        }else{
            let fpath = Path.join(filePath, docs[0].filename);
            try{
                await Util.promisify(FS.unlink)(fpath);
            }catch(e){}
            await docs[0].remove();
            res.end();
        }
    })
    app.get("/api/docs/:uuid/file", async (req,res)=>{
        let docs = await Document.find({uuid: req.params.uuid});
        if(docs.length == 0){
            res.status(404).end();
        }else{
            let fpath = Path.join(filePath, docs[0].filename);
            console.log(fpath, docs[0].origFilename)
            res.download(fpath, docs[0].origFilename);
        }
    })
}

init();