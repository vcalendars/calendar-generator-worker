// import Knex = require('knex');

import { InternalSeasonServiceTypes } from '@teamest/internal-season-client';

export interface ITeamSeason {
  teamName: string;
  seasonName: string;
}

export default class UserService {
  // knex: Knex;
  // constructor(knex: Knex) {
  //   this.knex = knex;
  // }

  async getUserIdsWithTeamSeason(
    teamName: string,
    seasonName: string,
  ): Promise<string[]> {
    return Promise.resolve([]);
  }

  async getUserTeamSeasons(userId: string): Promise<InternalSeasonServiceTypes.TeamSpecifier[]> {
    return Promise.resolve([
      {
        competitionName: 'Volleyball SA Indoor',
        seasonName: 'Theb Mon / A',
        teamName: 'Dateko',
      },
    ]);
  }
}
