import { NEXT_LEAGUE_UNLOCK_IMAGE } from "@app/utility/index";
import { UserTable } from "@app/model";

class LeagueService {
  public async getUpdatedLeagueDetailsOfUser(
    userIfExists: any,
    leagues: any,
    updatedXPPoints: number
  ) {
    let isNewLeagueUnlocked = false;
    let [previousLeague, nextLeague] = [null, null];
    let currentLeague = leagues.find(
      (x) => x.minPoint <= updatedXPPoints && x.maxPoint >= updatedXPPoints
    );
    console.log(currentLeague);
    let currentLeagueIndex = leagues.findIndex(
      (x) => x.minPoint <= updatedXPPoints && x.maxPoint >= updatedXPPoints
    );
    if (!currentLeague) {
      currentLeague = leagues.find(
        (data) => data._id.toString() == userIfExists.leagueId.toString()
      );
      currentLeagueIndex = leagues.findIndex(
        (data) => data._id.toString() == userIfExists.leagueId.toString()
      );
    }
    previousLeague = leagues[currentLeagueIndex - 1] || null;
    nextLeague = leagues[currentLeagueIndex + 1] || null;
    nextLeague = nextLeague ? JSON.parse(JSON.stringify(nextLeague)) : null;
    if (nextLeague) nextLeague.image = NEXT_LEAGUE_UNLOCK_IMAGE;
    if (userIfExists.leagueId.toString() != currentLeague._id.toString())
      isNewLeagueUnlocked = true;

    return { previousLeague, currentLeague, nextLeague, isNewLeagueUnlocked };
  }
}

export default new LeagueService();
