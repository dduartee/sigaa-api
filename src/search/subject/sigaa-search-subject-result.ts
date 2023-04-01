import { Parser } from '@helpers/sigaa-parser';
import { HTTP, ProgressCallback } from '@session/sigaa-http';
import { URL } from 'url';

/**
 * @category Internal
 */
export interface SubjectResultData {
  id: string;
  name: string;
  teams: TeamsResultData[]
}
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
 * @category Internal
 */
export class SigaaSearchTeamsResult {
  private _id: number;
  private _teacher: string;
  private _schedule: string;
  private _location: string;

  constructor(
    private http: HTTP,
    private parser: Parser,
    options: TeamsResultData
    
  ) {
    this._id = options.id;
    this._teacher = options.teacher;
    this._schedule = options.schedule;
    this._location = options.location;
  }
}

/**
 * @category Internal
 */
export class SigaaSearchSubjectResult {
  private _id : string;
  private _name: string;
  private _teams: TeamsResultData[];

  constructor(
    private http: HTTP,
    private parser: Parser,
    options: SubjectResultData
  ) {
    this._id = options.id;
    this._name = options.name;
    this._teams = options.teams;
  }
}

