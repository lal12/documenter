import Moment from "moment";
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
		Moment.locale(_lang);
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
	public date(data: Date){
		if(this.data.dateFormat)
			return Moment(data).format(this.data.dateFormat);
		return Moment(data).format("LL");
	}
	public time(data: Date){
		if(this.data.timeFormat)
			return Moment(data).format(this.data.timeFormat);
		return Moment(data).format("LTS");
	}
	public datetime(data: Date){
		if(this.data.datetimeFormat)
			return Moment(data).format(this.data.datetimeFormat);
		return Moment(data).format("LLL");
	}
	public number(no: number){
		return no.toLocaleString(this._lang);
	}

}