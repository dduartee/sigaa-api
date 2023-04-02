import { Parser } from '@helpers/sigaa-parser';
import { HTTP, ProgressCallback } from '@session/sigaa-http';
import { Sigaa } from 'src/sigaa-main';
import { URL } from 'url';


/**
 * @category Internal
 */
export interface TeamsResultData {
  id: number;
  teacher: string;
  schedule: string;
  location: string;
}

/**
 * @category Public
 */
export interface TeamsResult {
  readonly id: number;
  readonly teacher: string;
  readonly schedule: string;
  readonly location: string;
}

/**
 * @category Internal
 */
export interface SubjectResultData {
  id: string;
  name: string;
  teams: TeamsResultData[]
}

/**
 * @category Public
 */
export interface SubjectResult {
  readonly id: string;
  readonly name: string;
  readonly teams: TeamsResult[]
}



/**
 * @category Internal
 */
export class SigaaSearchTeamsResult implements TeamsResult {
  private _id: number;
  private _teacher: string;
  private _schedule: string;
  private _location: string;

  constructor(
    private _http: HTTP,
    private _parser: Parser,
    options: TeamsResultData
    
  ) {
    this._id = options.id;
    this._teacher = options.teacher;
    this._schedule = options.schedule;
    this._location = options.location;
  }

  
  public get id() : number {
    return this._id;
  }
  
  public get teacher() : string {
    return this._teacher;
  }
  
  public get schedule() : string {
    return this._schedule;
  }

  public get location() : string {
    return this._location;
  }
  
  
  public get http() : HTTP {
    return this._http;
  }
  

  public get parser() : Parser {
    return this._parser;
  }
  
  
}

/**
 * @category Internal
 */
export class SigaaSearchSubjectResult implements SubjectResult {
  private _id : string;
  private _name: string;
  private _teams: TeamsResultData[];

  constructor(
    private _http: HTTP,
    private _parser: Parser,
    options: SubjectResultData
  ) {
    this._id = options.id;
    this._name = options.name;
    this._teams = options.teams;
  }

  
  public get id() : string {
    return this._id;
  }
  
  public get name() : string {
    return this._name;
  }
  
  public get teams() : TeamsResult[] {
    return this._teams;
  }

  
  public get http() : HTTP {
    return this._http;
  }
  
  
  public get parser() : Parser {
    return this._parser;
  }
  
}

