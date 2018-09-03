import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";

import { File } from "./file";

@Entity("keyword")
export class Keyword extends BaseEntity {
	@PrimaryGeneratedColumn("increment")
	id!: number;

	@Column()
	keyword!: string;

	@ManyToMany(type => File, f => f.keywords, { lazy: true })
	files!: Promise<File[]>;
}