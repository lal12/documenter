import { ObjectType, Field, Resolver, Query, Arg } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, ManyToMany, JoinTable, IsNull, AfterRemove, BeforeRemove, BeforeInsert } from "typeorm";
import { IsUUID, IsString, IsIn, MinLength } from "class-validator";
import { Document } from "./document";
import { Keyword } from "./keyword";
import * as Path from "path";
import * as FS from "fs-extra";
import { getServer } from "../server";
import { docPreview, imgPreview } from "../doc-thumbnail";

export const fileTypes: string[] = [
	"pdf", "png", "jpg", "txt", "md", "docx", "xlsx", "odt", "ods"
];

@ObjectType("file")
@Entity("file")
export class File extends BaseEntity {
	@AfterRemove()
	deleteFile(){
		FS.unlink(Path.join(getServer().filesPath, this.filename)).catch(e=>console.warn('failed to delete file'+this.filename));
		if(!this.isTextFile)
			FS.unlink(Path.join(getServer().filesPath, this.uuid+'.ocr.pdf')).catch(e=>console.debug('failed to delete ocr file'+this.filename));
		FS.unlink(Path.join(getServer().thumbnailPath, this.uuid+'.jpg')).catch(e=>console.debug('failed to delete thumbnail for '+this.uuid));
	}

	@Field() @IsUUID()
	@PrimaryGeneratedColumn("uuid")
	uuid!: string;

	@Field() @IsString() @IsIn(["pdf", "png", "jpg", "txt", "md", "docx", "xlsx", "odt", "ods"])
	@Column("text", {
		nullable: false,
		name: "filetype"
	})
	filetype!: string;

	@Field() @IsString() @MinLength(1)
	@Index({ fulltext: true })
	@Column()
	origFilename!: string;

	@Field(type=>Document)
	@ManyToOne(type => Document, {
		eager: true, nullable: true, onDelete: "CASCADE"
	})
	@JoinColumn({ name: "documentUUID" })
	document?: Document;

	@Column("uuid", { nullable: true })
	documentUUID?: string;

	@ManyToMany(type => Keyword, kw => kw.files, { lazy: true, onDelete: 'CASCADE' })
	@JoinTable()
	keywords!: Promise<Keyword[]>;

	@Field(type=>[String], {name: "keywords"})
	async getKeywords(){
		return (await this.keywords).map(v=>v.keyword)
	}

	@Field(type=>String)
	get filename(): string {
		return this.uuid + "." + this.filetype;
	}

	public async toObj() {
		return {
			uuid: this.uuid,
			filetype: this.filetype,
			origFilename: this.origFilename,
			document: this.document ? this.document.uuid : null,
			keywords: (await this.keywords).map(kw => kw.keyword)
		}
	}

	public async createThumbnail(filePath: string, thumbnailPath: string){
		let ws = FS.createWriteStream(Path.join(thumbnailPath, this.uuid+".jpg"));
		if(["jpg", "png", "pdf"].indexOf(this.filetype) > -1){
			let rs = await imgPreview(Path.join(filePath, this.filename));
			rs.pipe(ws, {end: true});
		}else{
			let rs = await docPreview(Path.join(filePath, this.filename));
			rs.pipe(ws, {end: true});
		}
	}

	@Field(type=>Boolean)
	public get isTextFile(){
		switch(this.filetype){
			case "png":
			case "jpg":
				return false;
			case "txt":
			case "md":
			case "docx":
			case "xlsx":
			case "odt":
			case "ods":
				return true
			case "pdf":
				return "?"
		}
	}
}


@Resolver(File)
class FileResolver{
	@Query(returns=>[File])
	async inbox(): Promise<File[]>{
		return await File.find({documentUUID: IsNull() as any})
	}

	@Query(returns=>File)
	async file(@Arg("uuid") uuid: string): Promise<File>{
		let f =  await File.findOne(uuid);
		if(!f)
			throw new Error("No file found with uuid "+uuid)
		return f;
	}
}
