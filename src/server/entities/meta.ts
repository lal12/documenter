import { ObjectType, Field } from "type-graphql";

import { Entity, BaseEntity, PrimaryColumn, Index, Column, OneToMany } from "typeorm";

import { IsString, MinLength, IsBoolean, IsIn } from "class-validator";
import { MetaData } from "./metadata";

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

	@Field() @IsBoolean()
	@Column()
	optional!: boolean;

	@Field() @IsBoolean()
	@Column()
	deleteable!: boolean;

	@Field() @IsIn(["date", "datetime", "string", "uint", "int", "decimal"])
	@Column("enum", {
		nullable: false,
		enum: ["date", "datetime", "string", "uint", "int", "decimal"],
		name: "type"
	})
	type!: "date" | "datetime" | "string" | "uint" | "int" | "decimal";

	@Field(tyle=>[MetaData])
	@OneToMany(type => MetaData, md => md.meta, { lazy: true })
	metadatas!: Promise<MetaData[]>;

	public getType() {
		switch (this.type) {
			case "uint":
			case "int":
			case "decimal":
				return Number;
			case "date":
				return Date;
			case "string":
				return String;
			default:
				throw new Error("Unknown type: " + this.type);
		}
	}
}
