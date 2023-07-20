import { Parser } from '@helpers/sigaa-parser';
import { HTTP } from '@session/sigaa-http';

/**
 * @category Internal
 */
export interface TeamsResultDataIFSC {
  id: number;
  teacher: string;
  location: string;
}

/**
 * @category Public
 */
export interface TeamsResultIFSC {
  readonly id: number;
  readonly teacher: string;
  readonly location: string;
}

/**
 * @category Internal
 */
export interface SubjectResultDataIFSC {
  id: string;
  name: string;
  teams: TeamsResultDataIFSC[];
}

/**
 * @category Public
 */
export interface SubjectResultIFSC {
  readonly id: string;
  readonly name: string;
  readonly teams: TeamsResultIFSC[];
}

/**
 * @category Internal
 */
export class SigaaSearchTeamsResultIFSC implements TeamsResultIFSC {
  private _id: number;
  private _teacher: string;
  private _location: string;

  constructor(
    private _http: HTTP,
    private _parser: Parser,
    options: TeamsResultDataIFSC
  ) {
    this._id = options.id;
    this._teacher = options.teacher;
    this._location = options.location;
  }

  public get id(): number {
    return this._id;
  }

  public get teacher(): string {
    return this._teacher;
  }

  public get location(): string {
    return this._location;
  }

  public get http(): HTTP {
    return this._http;
  }

  public get parser(): Parser {
    return this._parser;
  }
}

/**
 * @category Internal
 */
export class SigaaSearchSubjectResultIFSC implements SubjectResultIFSC {
  private _id: string;
  private _name: string;
  private _teams: TeamsResultDataIFSC[];

  constructor(
    private _http: HTTP,
    private _parser: Parser,
    options: SubjectResultDataIFSC
  ) {
    this._id = options.id;
    this._name = options.name;
    this._teams = options.teams;
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get teams(): TeamsResultIFSC[] {
    return this._teams;
  }

  public get http(): HTTP {
    return this._http;
  }

  public get parser(): Parser {
    return this._parser;
  }
}
