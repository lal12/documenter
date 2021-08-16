import { ObjectType, Field, Resolver, Query, Arg } from "type-graphql";

import { Entity, BaseEntity, PrimaryColumn, Index, Column, ManyToMany } from "typeorm";

import { IsString, MinLength, MaxLength, Length } from "class-validator";

import { Document } from "./document";

@ObjectType("tag")
@Entity("tag")
export class Tag extends BaseEntity {
	@Field() @IsString() @MinLength(2) @MaxLength(20)
	@PrimaryColumn({
		name: "id",
		type: "varchar",
		length: 20
	})
	id!: string;

	@Field() @IsString() @MinLength(3) @MaxLength(50)
	@Index({ fulltext: true })
	@Column("varchar")
	title!: string;

	@Field() @IsString() @Length(6)
	@Index({ fulltext: true })
	@Column("varchar")
	color!: string;

	@Field(type=>[Document])
	@ManyToMany(type => Document, d => d.tags, { lazy: true })
	documents!: Promise<Document[]>;
}

@Resolver(Tag)
class DocumentResolver{
	@Query(returns=>Tag)
	async tag(@Arg("id", type=>String, {nullable: false}) id: string) : Promise<Tag>{
		let d = await Tag.findOne(id);
		if(!d)
			throw new Error("No document with id "+id);
		return d;
	}

	@Query(returns=>[Tag])
	async tags(@Arg("ids", type=>[String], {nullable: true}) ids?: string[]) : Promise<Tag[]>{
		if(ids)
			return await Tag.findByIds(ids);
		else
			return await Tag.find();
	}
}