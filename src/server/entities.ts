import {Index,Entity, Column, ManyToOne, 
    CreateDateColumn, PrimaryGeneratedColumn, 
    BaseEntity,
    OneToMany,
    PrimaryColumn,
    ManyToMany,
    JoinTable} from "typeorm";

@Entity("document")
export class Document extends BaseEntity{
	@PrimaryGeneratedColumn("uuid")
    uuid!: string;
    
	@CreateDateColumn({ 
		nullable:false,
	})
    added!: Date;

    @CreateDateColumn({ 
		nullable:false,
	})
    modified!: Date;

    @CreateDateColumn({ 
		nullable:false,
	})
    documentDate!: Date;
    
    /*@Column("enum",{ 
		nullable:false,
		enum:["pdf","png","jpg","txt"],
		name:"filetype"
    })*/
    @Column({type: "varchar", length: 15})
    filetype!: string;
    
    @Column({type: "varchar", length: 40})
    title!: string;
    
    @Column("varchar")
    origFilename!: string;
        
    @ManyToOne(type=>Namespace, (ns: Namespace)=>ns.documents)
    namespace!: Namespace;
    
    @Column({type: "simple-array"})
    tags!: string[];

    //@Index({fulltext: true})
    @OneToMany(type=>MetaData, md=>md.document)
    metadata!: Promise<Meta[]>;

    //@Index({fulltext: true})
    @Column({type: "simple-array"})
    autoKeywords!: string[];

    //@Index({fulltext: true})
    @Column({type: "simple-array"})
    customKeywords!: string[];
    
    get filename(): string{
        return this.uuid+"."+this.filetype;
    }
}

@Entity("namespace")
export class Namespace extends BaseEntity{
    @PrimaryColumn({
        name: "id",
        type: "varchar",
        length: 20
    })
    id!: string;
    
    @Index({fulltext: true})
    @Column("varchar")
    title!: string;

    @OneToMany(type=>Document, doc=>doc.namespace)
    documents!: Promise<Document[]>;
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
    @Column("varchar")
    title!: string;

    @Column("boolean")
    isArray!: boolean;

    @Column("boolean")
    optional!: boolean;

    @Column("boolean")
    deleteable!: boolean;

    /*@Column("enum",{ 
		nullable:false,
		enum:["date","string","uint","int","decimal"],
		name:"type"
    })*/
    @Column({type: "varchar", length: 15})
	type!: string;

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
    
    @Column({type: "varchar", length: 30})
    data!: string;

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
}