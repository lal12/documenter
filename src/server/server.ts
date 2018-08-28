import * as Multer from "multer";
import { NextHandleFunction } from 'connect';
import {Express} from "express";

export interface Server{
	thumbnailPath: string,
	filesPath: string,
	tmpPath: string,
	assetsPath: string,
	upload: Multer.Instance,
	jsonParser: NextHandleFunction,
	app: Express,
}