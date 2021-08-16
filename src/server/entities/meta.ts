import { ObjectType, Field, Resolver, Query } from "type-graphql";

import { Entity, BaseEntity, PrimaryColumn, Index, Column, OneToMany, ManyToMany, ManyToOne } from "typeorm";

import { IsString, MinLength, IsBoolean, IsIn } from "class-validator";
import { MetaData } from "./metadata";
import { DateTime } from "luxon";
import { MetaValueType } from '../shared/types';
import { Tag } from "./tag";

@ObjectType("meta")
@Entity("meta")
export class Meta extends BaseEntity {
	@Field() @IsString() @MinLength(2) @MinLength(20)
	@PrimaryColumn({
		name: "id",
		type: "varchar",
		length: 20
	})
	id!: string;

	@Field() @IsString()
	@Index({ fulltext: true })
	@Column({ type: "varchar", length: 40 })
	title!: string;

	@Field() @IsBoolean()
	@Column()
	isArray!: boolean;

	/*@Field(type=>Tag, {nullable: true}) 
	@ManyToOne(type => Tag, {nullable: true, eager: true})
	forTag?: Tag;*/

	@Field() @IsBoolean()
	@Column()
	required!: boolean;
	
	@Field() @IsBoolean()
	@Column()
	deletable!: boolean;

	@Field() @IsIn(["date", "datetime", "string", "uint", "int", "decimal"])
	@Column("text", {
		nullable: false,
		name: "type"
	})
	type!: MetaValueType;

	@Field(tyle=>[MetaData])
	@OneToMany(type => MetaData, md => md.meta, { lazy: true })
	metadatas!: Promise<MetaData[]>;

	public getType() {
		switch (this.type) {
			case MetaValueType.UINT:
			case MetaValueType.INT:
			case MetaValueType.DECIMAL:
				return Number;
			case MetaValueType.DATE:
			case MetaValueType.DATETIME:
				return DateTime;
			case MetaValueType.STRING:
				return String;
			default:
				throw new Error("Unknown type: " + this.type);
		}
	}
}

@Resolver(Meta)
class MetaResolver{
	@Query(returns=>[Meta])
	async metas() : Promise<Meta[]>{
		const metas = await Meta.find();
		return metas;
	}
}
