import { Parser } from '@helpers/sigaa-parser';
import { HTTP } from '@session/sigaa-http';

/**
 * @category Internal
 */
export interface TeamsResultDataUNB {
  id: number;
  teacher: string;
  schedule: string;
  location: string;
}

/**
 * @category Public
 */
export interface TeamsResultUNB {
  readonly id: number;
  readonly teacher: string;
  readonly schedule: string;
  readonly location: string;
}

/**
 * @category Internal
 */
export interface SubjectResultDataUNB {
  id: string;
  name: string;
  teams: TeamsResultDataUNB[];
}

/**
 * @category Public
 */
export interface SubjectResultUNB {
  readonly id: string;
  readonly name: string;
  readonly teams: TeamsResultUNB[];
}

/**
 * @category Internal
 */
export class SigaaSearchTeamsResultUNB implements TeamsResultUNB {
  private _id: number;
  private _teacher: string;
  private _schedule: string;
  private _location: string;

  constructor(
    private _http: HTTP,
    private _parser: Parser,
    options: TeamsResultDataUNB
  ) {
    this._id = options.id;
    this._teacher = options.teacher;
    this._schedule = options.schedule;
    this._location = options.location;
  }

  public get id(): number {
    return this._id;
  }

  public get teacher(): string {
    return this._teacher;
  }

  public get schedule(): string {
    return this._schedule;
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
export class SigaaSearchSubjectResultUNB implements SubjectResultUNB {
  private _id: string;
  private _name: string;
  private _teams: TeamsResultDataUNB[];

  constructor(
    private _http: HTTP,
    private _parser: Parser,
    options: SubjectResultDataUNB
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

  public get teams(): TeamsResultUNB[] {
    return this._teams;
  }

  public get http(): HTTP {
    return this._http;
  }

  public get parser(): Parser {
    return this._parser;
  }
}
