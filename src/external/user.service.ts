import Knex = require('knex');

export interface ITeamSeason {
  teamName: string;
  seasonName: string;
}

export default class UserService {
  knex: Knex;
  constructor(knex: Knex) {
    this.knex = knex;
  }

  async getUserIdsWithTeamSeason(
    teamName: string,
    seasonName: string,
  ): Promise<string[]> {
    return Promise.resolve([]);
  }

  async getUserTeamSeasons(userId: string): Promise<ITeamSeason[]> {
    return Promise.resolve([
      {
        teamName: 'Dateko',
        seasonName: 'Theb Mon / A',
      },
    ]);
  }
}
