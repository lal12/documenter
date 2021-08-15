import { ObjectType, Field, Resolver, Query, Arg, ArgsType, Args } from "type-graphql";

import { Entity, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column, OneToMany, Index, ManyToMany, JoinTable, AfterRemove, BeforeRemove, BeforeUpdate, BeforeInsert } from "typeorm";

import { IsUUID, IsDate, IsString, MinLength, MaxLength } from "class-validator";
import { File } from "./file";
import { Tag } from "./tag";
import { MetaData } from "./metadata";
import { Meta } from "./meta";
import { keywordsFromText } from "../keywords";
import { DateTime } from "luxon";
import { GraphQLScalarType, Kind } from "graphql";


export const GQLDateTime = new GraphQLScalarType({
	name: "DateTime",
	description: "DateTime",
	serialize(value: DateTime): number {
	  // check the type of received value
	  if (!(value instanceof DateTime)) {
		throw new Error("GQLDateTime can only serialize DateTime values");
	  }
	  return value.toMillis(); // value sent to the client
	},
	parseValue(value: number): DateTime {
	  // check the type of received value
	  if (typeof value !== "number") {
		throw new Error("GQLDateTime can only parse number values");
	  }
	  return DateTime.fromMillis(value); // value from the client input variables
	},
	parseLiteral(ast): DateTime {
	  // check the type of received value
	  if (ast.kind !== Kind.INT) {
		throw new Error("GQLDateTime can only parse INT values");
	  }
	  return DateTime.fromMillis(parseInt(ast.value));
	},
});

@ObjectType("DocumentAttribute")
class DocumentAttribute{
	@Field()
	id!: string;
	@Field()
	title!: string;
	@Field()
	type!: string;
	@Field()
	optional!: boolean;
	@Field()
	isArray!: boolean;
	@Field(type=>[String])
	value!: string[];
}


const DateTimeTransformer = {
	from: (v: number)=>DateTime.fromMillis(v),
	to: (v: DateTime)=>v.toMillis()
}
@ObjectType("document")
@Entity("document")
export class Document extends BaseEntity {
	@BeforeRemove()
	deleteFiles(){
		this.files.then(files=>files.forEach(f=>f.deleteFile()));
	}

	@BeforeUpdate()
	beforeUpdate(){
		this.modified = DateTime.now();
	}

	@BeforeInsert()
	beforeInsert(){
		this.added = DateTime.now();
	}

	@Field() @IsUUID()
	@PrimaryGeneratedColumn("uuid")
	uuid!: string;

	@Field(type => GQLDateTime) @IsDate()
	@Column({
		type: "integer",
		nullable: false,
		transformer: DateTimeTransformer,

	})
	added!: DateTime;

	@Field(type => GQLDateTime) @IsDate()
	@Column({
		type: "integer",
		nullable: false,
		transformer: DateTimeTransformer
	})
	modified!: DateTime;

	@Field(type => GQLDateTime) @IsDate()
	@Column({
		type: 'integer',
		nullable: false,
		transformer: DateTimeTransformer
	})
	documentDate!: DateTime;

	@Field(type=>[File])
	@OneToMany(type => File, file => file.document, { lazy: true, onDelete: 'CASCADE'})
	files!: Promise<File[]>;

	@Field() @IsString() @MinLength(1) @MaxLength(40)
	@Index({ fulltext: true })
	@Column({ type: "varchar", length: 40 })
	title!: string;

	@Field(type=>[Tag])
	@ManyToMany(type => Tag, t => t.documents, { eager: true })
	@JoinTable()
	tags!: Tag[];

	@OneToMany(type => MetaData, md => md.document, {onDelete: "CASCADE"})
	metadata!: Promise<MetaData[]>;

	@Field(type=>[DocumentAttribute],{name: "attributes"})
	public async getAttributes(){
		type meta = {
			id: string,
			title: string,
			type: string,
			optional: boolean,
			isArray: boolean,
			value?: string[]
		};
		let metadata: { [key: string]: meta } = {};
		let mds = await this.metadata;
		await Promise.all(mds.map(md => md.reload()))
		for (let md of mds) {
			if (!metadata[md.meta.id]) {
				metadata[md.meta.id] = {
					id: md.meta.id,
					title: md.meta.title,
					type: md.meta.type,
					isArray: md.meta.isArray,
					optional: md.meta.optional,
					value: [md.data as string]
				};
			} else {
				if (md.meta.isArray) {
					(metadata[md.meta.id].value as string[]).push(md.data!);
				} else {
					console.warn("Multiple not array meta: ", md);
				}
			}
		}
		return Object.values(metadata);
	}

	public async toObj(){
		throw new Error("Deprecated!")
		return {};
	}

	public static async newDoc(title: string = "New Document") {
		let now = DateTime.now();
		let doc = new Document();
		doc.title = title;
		doc.added = now;
		doc.tags = [];
		doc.documentDate = now;
		doc.modified = now;
		await doc.save();
		let meta = await Meta.find({ optional: false });
		for (let m of meta) {
			let md = new MetaData();
			md.meta = m;
			md.document = doc;
			await md.save();
		}
		return doc;
	}
}


@ArgsType()
class GetDocumentsArgs{
	@Field(type=>[String], {nullable: true})
	uuids?: string[];

	@Field(type=>String, {nullable: true})
	search?: string;

	@Field(type=>[String], {nullable: true})
	tags?: string[];
}

@Resolver(Document)
class DocumentResolver{
	@Query(returns=>Document)
	async document(@Arg("uuid", type=>String, {nullable: false}) uuid: string) : Promise<Document>{
		let d = await Document.findOne(uuid);
		if(!d)
			throw new Error("No document with uuid "+uuid);
		return d;
	}

	@Query(returns=>[Document])
	async documents(@Args() {uuids, search, tags}: GetDocumentsArgs) : Promise<Document[]>{
		let docs: Document[];
		if(uuids)
			docs = await Document.findByIds(uuids,{loadEagerRelations: true});
		else
			docs = await Document.find({loadEagerRelations: true});
		for(let d of docs){
			await d.reload();
		}
		if(tags){
			let matching = [];
			for(let d of docs){
				let dTags = (await d.tags).map(t=>t.id);
				if(tags.every(val => dTags.includes(val))){
					matching.push(d);
				}
			}
			docs = matching;
		}
		if(search && docs.length > 0){
			let docScores = docs.map(d=>({d, score: 0}));
			const kws = keywordsFromText(search);
			const sglScr = 1/kws.length; // Single Score
			for(let ds of docScores){
				if(ds.d.title.indexOf(search) > -1)
					ds.score += 5;
				let kwScore = 0;
				let fnameScore = 0;
				let files = await ds.d.files;
				for(let f of files){
					let fkws = await f.keywords;
					for(let kw of kws){
						kwScore += sglScr * fkws.filter(fkw=>kw==fkw.keyword).length;
						if(f.origFilename.indexOf(kw) > -1)
							fnameScore += 1;
					}
					
				}
				ds.score += kwScore + fnameScore / files.length;
			}
			docs = docScores.filter(ds=>ds.score > 0).sort((a,b)=>a.score-b.score).map(ds=>ds.d);
		}
		return docs;
	}
}