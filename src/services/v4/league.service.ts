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
    let currentLeagueIndex = leagues.findIndex(
      (x) => x.minPoint <= updatedXPPoints && x.maxPoint >= updatedXPPoints
    );
    if (!currentLeague && updatedXPPoints >= 10000) {
      currentLeague = leagues[leagues.length - 1];
      currentLeagueIndex = leagues.findIndex(
        (data) => data._id.toString() == currentLeague._id.toString()
      );
    }
    previousLeague = leagues[currentLeagueIndex - 1] || null;
    nextLeague = leagues[currentLeagueIndex + 1] || null;
    nextLeague = nextLeague ? JSON.parse(JSON.stringify(nextLeague)) : null;
    if (nextLeague) nextLeague.image = NEXT_LEAGUE_UNLOCK_IMAGE;
    let existingLeague = leagues.find(
      (x) =>
        x.minPoint <= userIfExists.xpPoints &&
        x.maxPoint >= userIfExists.xpPoints
    );
    if (
      userIfExists.xpPoints == 0 ||
      existingLeague._id.toString() != currentLeague._id.toString()
    ) {
      isNewLeagueUnlocked = true;
    }

    return { previousLeague, currentLeague, nextLeague, isNewLeagueUnlocked };
  }
}

export default new LeagueService();
