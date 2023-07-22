import { Parser } from '@helpers/sigaa-parser';
import { HTTP } from '@session/sigaa-http';

/**
 * @category Internal
 */
export interface TeamsResultDataUFFS {
  id: number;
  teacher: string;
  location: string;
}

/**
 * @category Public
 */
export interface TeamsResultUFFS {
  readonly id: number;
  readonly teacher: string;
  readonly location: string;
}

/**
 * @category Internal
 */
export interface SubjectResultDataUFFS {
  id: string;
  name: string;
  teams: TeamsResultDataUFFS[];
}

/**
 * @category Public
 */
export interface SubjectResultUFFS {
  readonly id: string;
  readonly name: string;
  readonly teams: TeamsResultUFFS[];
}

/**
 * @category Internal
 */
export class SigaaSearchTeamsResultUFFS implements TeamsResultUFFS {
  private _id: number;
  private _teacher: string;
  private _location: string;

  constructor(
    private _http: HTTP,
    private _parser: Parser,
    options: TeamsResultDataUFFS
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
export class SigaaSearchSubjectResultUFFS implements SubjectResultUFFS {
  private _id: string;
  private _name: string;
  private _teams: TeamsResultDataUFFS[];

  constructor(
    private _http: HTTP,
    private _parser: Parser,
    options: SubjectResultDataUFFS
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

  public get teams(): TeamsResultUFFS[] {
    return this._teams;
  }

  public get http(): HTTP {
    return this._http;
  }

  public get parser(): Parser {
    return this._parser;
  }
}
