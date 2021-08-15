import { DateTime, Settings } from "luxon";
import Format from "string-format";

interface LocaleData{
	strings: {[name: string]: string};
	lang: string;
	dateFormat?: string;
	datetimeFormat?: string;
	timeFormat?: string;
	unknown: string;
}

export let intl : Intl;

export default class Intl{
	private data!: LocaleData;
	private _format: (template: string, ...args: any[])=>string;
	private static intl : Intl;

	public static async create(load: ()=>LocaleData|Promise<LocaleData>): Promise<Intl>{
		return Promise.resolve(load()).then(data=>{
			const _intl = new Intl(data.lang);
			_intl.data = data;
			intl = _intl;
			return _intl;
		})
	}

	private constructor(private _lang: string){
		Settings.defaultLocale = _lang;
		this._format = Format.create({
			upper: (s:string)=>s.toUpperCase(),
			lower: (s:string)=>s.toLowerCase(),
			date: (dt:Date)=>this.date(dt),
			datetime: (dt:Date)=>this.datetime(dt),
			time: (dt:Date)=>this.time(dt),
			number: (no:number)=>this.number(no)
		})
	}
	public format(template: string, args: any[]){
		return this._format(template, ...args);
	}
	public get(name: string, ...args: any[]){
		if(!this.data.strings[name]){
			console.warn("Unknown value: ", name);
			return name;
		}else{
			return this.format(this.data.strings[name], args);
		}
	}
	get locale(){
		return this._lang;
	}
	public date(date: Date|DateTime){
		if(date instanceof Date)
			date = DateTime.fromJSDate(date);
		if(this.data.dateFormat)
			return date.toFormat(this.data.dateFormat);
		return date.toFormat("LL");
	}
	public time(date: Date|DateTime){
		if(date instanceof Date)
			date = DateTime.fromJSDate(date);
		if(this.data.timeFormat)
			return date.toFormat(this.data.timeFormat);
		return date.toFormat("LTS");
	}
	public datetime(date: Date|DateTime){
		if(date instanceof Date)
			date = DateTime.fromJSDate(date);
		if(this.data.datetimeFormat)
			return date.toFormat(this.data.datetimeFormat);
		return date.toFormat("LLL");
	}
	public number(no: number){
		return no.toLocaleString(this._lang);
	}

}