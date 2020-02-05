import Knex = require('knex');
import { SerialisedMatch } from '@vcalendars/models/raw';
import { TeamSeason } from '@vcalendars/models/processed';

interface DBTeamSeason {
  team_season_id: number;
  team_name: string;
  season_name: string;
  created_at: string;
  updated_at: string;
}

interface DBTeamSeasonMatch {
  team_season_match_id: string;
  team_season_id: string;
  timezone: string;
  match_duration_minutes: number;
  matches: SerialisedMatch[];
  created_at: string;
  updated_at: string;
}

interface ITeamSeasonQuery {
  seasonName: string;
  teamName: string;
}

export default class TeamSeasonService {
  knex: Knex;
  constructor(knex: Knex) {
    this.knex = knex;
  }

  async getTeamSeasons(teamSeasons: ITeamSeasonQuery[]): Promise<TeamSeason> {
    const latestMatches = await this.knex('team_season')
      .join(
        'team_season_match',
        'team_season.team_season_id',
        '=',
        'team_season_match.team_season_id',
      )
      .select(
        'team_season.season_name',
        'team_season.team_name',
        'team_season_match.matches',
        'team_season_match.match_duration_minutes',
        'team_season_match.timezone',
        'team_season_match.scraped_at',
      )
      .whereIn(
        ['team_season.season_name', 'team_season.team_name'],
        teamSeasons.map(ts => [ts.seasonName, ts.teamName]),
      )
      .orderBy('team_season_match.created_at', 'desc')
      .first();

    return {
      matchDuration: latestMatches.match_duration_minutes,
      matches: latestMatches.matches,
      seasonName: latestMatches.season_name,
      teamName: latestMatches.team_name,
      timezone: latestMatches.timezone,
      timeScraped: latestMatches.scraped_at,
    };
  }
}
