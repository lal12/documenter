import {Index,Entity, Column, ManyToOne, 
    CreateDateColumn, PrimaryGeneratedColumn, 
    BaseEntity,
    OneToMany,
    PrimaryColumn,
    ManyToMany,
    JoinTable,
    UpdateDateColumn,
    JoinColumn} from "typeorm";
import {Document as Document2} from "./entities";

export const fileTypes :string[] = [
    "pdf","png","jpg","txt","md","docx","xlsx","odt","ods","txt"
];


@Entity("file")
export class File extends BaseEntity{
    @PrimaryGeneratedColumn("uuid")
    uuid!: string;

    @Column("enum",{ 
		nullable:false,
		enum:fileTypes,
		name:"filetype"
    })
    filetype!: string;

    @Index({fulltext: true})
    @Column()
    origFilename!: string;

    @ManyToOne(type=>Document,{
        eager: true, nullable: true, onDelete: "CASCADE"
    })
    @JoinColumn({ name: "documentUUID" })
    document?: Document2;

    @Column("uuid", {nullable: true})
    documentUUID?: string;

    @ManyToMany(type=>Keyword, kw=>kw.files, {eager: true})
    @JoinTable()
    keywords!: Keyword[];

    get filename(): string{
        return this.uuid+"."+this.filetype;
    }

    public toObj(){
        return {
            uuid: this.uuid,
            filetype: this.filetype,
            origFilename: this.origFilename,
            document: this.document ? this.document.uuid : null,
            keywords: this.keywords.map(kw=>kw.keyword)
        }
    }
}

@Entity("keyword")
export class Keyword extends BaseEntity{
    @PrimaryGeneratedColumn("increment")
    id!: number;

    @Column()
    keyword!: string;

    @ManyToMany(type=>File, f=>f.keywords, {lazy: true})
    files!: Promise<File[]>;
}

@Entity("document")
export class Document extends BaseEntity{
	@PrimaryGeneratedColumn("uuid")
    uuid!: string;
    
	@CreateDateColumn({ 
		nullable:false,
	})
    added!: Date;

    @UpdateDateColumn({ 
		nullable:false,
	})
    modified!: Date;

    @Column({ 
        nullable:false,
	})
    documentDate!: Date;
 
    @OneToMany(type=>File, file=>file.document, {lazy: true})
    files!: Promise<File[]>;

    @Index({fulltext: true})
    @Column({type: "varchar", length: 40})
    title!: string;
    
    @ManyToMany(type=>Tag, t=>t.documents, {eager: true})
    @JoinTable()
    tags!: Tag[];

    @OneToMany(type=>MetaData, md=>md.document)
    metadata!: Promise<MetaData[]>;

    public async toObj(){
        let metadata = (await this.metadata).map(md=>({
            name: md.meta.id, type: md.meta.type, 
            isArray: md.meta.isArray, value: md.data,
            optional: md.meta.optional
        }));
        let files = await this.files;
        let keywords : string[] = [];
        await Promise.all(files.map(async f=>{
            await f.reload();
            keywords = keywords.concat(f.keywords.map(kw=>kw.keyword));
        }))
        let file = await File.findOne({uuid: files[0].uuid})
        return {
            uuid: this.uuid,
            added: this.added,
            modified: this.modified,
            documentDate: this.documentDate,
            files: files.map(f=>({name: f.origFilename, uuid: f.uuid})),
            title: this.title,
            tags: this.tags.map(t=>t.id),
            metadata,
            keywords
        }
    }

    public static async newDoc(){
        let now = new Date();
        let doc = new Document();
		doc.title = "Neues Dokument";
		doc.added = now;
		doc.tags = [];
		doc.documentDate = now;
		doc.modified = now;
		await doc.save();
		let meta = await Meta.find({optional: false});
		for(let m of meta){
			let md = new MetaData();
			md.meta = m;
			md.document = doc;
			await md.save();	
        }
        return doc;
    }
}

@Entity("meta")
export class Meta extends BaseEntity{
    @PrimaryColumn({
        name: "id",
        type: "varchar",
        length: 20
    })
    id!: string;
    
    @Index({fulltext: true})
    @Column({type: "varchar", length: 40})
    title!: string;

    @Column()
    isArray!: boolean;

    @Column()
    optional!: boolean;

    @Column()
    deleteable!: boolean;

    @Column("enum",{ 
		nullable:false,
		enum:["date","string","uint","int","decimal"],
		name:"type"
    })
	type!: "date"|"string"|"uint"|"int"|"decimal";

    @OneToMany(type=>MetaData, md=>md.meta)
    metadatas!: Promise<MetaData[]>;

    public getType(){
        switch(this.type){
            case "uint":
            case "int":
            case "decimal":
                return Number;
            case "date":
                return Date;
            case "string":
                return String;
            default:
                throw new Error("Unknown type: "+this.type);
        }
    }
}

@Entity("metadata")
export class MetaData extends BaseEntity{
    @PrimaryGeneratedColumn("increment", {name: "id"})
    id!: number;
    
    @Column({nullable: true})
    index?: number;

    @Column({type: "varchar", length: 30, nullable: true})
    data?: string;

    @ManyToOne(type=>Document)
    document!: Document;

    @ManyToOne(type=>Meta)
    meta!: Meta;
}

@Entity("tag")
export class Tag extends BaseEntity{
    @PrimaryColumn({
        name: "id",
        type: "varchar",
        length: 20
    })
    id!: string;
    
    @Index({fulltext: true})
    @Column("varchar")
    title!: string;

    @ManyToMany(type=>Document, d=>d.tags, {lazy: true})
    documents!: Promise<Document[]>;
}