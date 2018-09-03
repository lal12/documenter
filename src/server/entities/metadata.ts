import { ObjectType, Field, Int } from "type-graphql";

import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";

import { IsInt, Min, IsString, MaxLength } from "class-validator";

import { Document } from "./document";

import { Meta } from "./meta";

@ObjectType("metadata")
@Entity("metadata")
export class MetaData extends BaseEntity {
	@Field(type=>Int) @IsInt() @Min(0)
	@PrimaryGeneratedColumn("increment", { name: "id" })
	id!: number;

	@Field(type=>Int,{nullable: true}) @IsInt() @Min(0)
	@Column({ nullable: true })
	index?: number;

	@Field({nullable: true}) @IsString() @MaxLength(30)
	@Column({ type: "varchar", length: 30, nullable: true })
	data?: string;

	@Field(type=>Document)
	@ManyToOne(type => Document)
	document!: Document;

	@Field(type=>Meta)
	@ManyToOne(type => Meta, { eager: true })
	meta!: Meta;
}