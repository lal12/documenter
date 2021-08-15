import { ObjectType, Field } from "type-graphql";

import { Entity, BaseEntity, PrimaryColumn, Index, Column, OneToMany } from "typeorm";

import { IsString, MinLength, IsBoolean, IsIn } from "class-validator";
import { MetaData } from "./metadata";
import { DateTime } from "luxon";
import { MetaValueType } from '../shared/types';

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
