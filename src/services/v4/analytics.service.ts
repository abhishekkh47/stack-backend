import * as amplitude from "@amplitude/analytics-node";
import Config from "@app/config";
import { IStreak } from "@app/types";
import { formatMDY } from "@app/utility/date";

class AnalyticsService {
  /**
   * Initializes the analytics service
   */
  public init() {
    // amplitude initialization
    amplitude.init(Config.AMPLITUDE_KEY);
  }

  /**
   * Send an event to the analytics service
   * @param event The event to send
   * @param properties Optional properties to send
   */
  public async identifyOnce(
    userId: Object,
    dict: {
      [key: string]: amplitude.Types.ValidPropertyType;
    }
  ) {
    const identifyObj = new amplitude.Identify();

    Object.keys(dict).forEach((key) => {
      identifyObj.setOnce(key, dict[key]);
    });

    await amplitude.identify(identifyObj, {
      user_id: userId.toString(),
    }).promise;
  }

  /**
   * Send an event to the analytics service
   * @param event The event to send
   * @param properties Optional properties to send
   */
  public sendEvent(
    event: string,
    props?: { [key: string]: any },
    opts?: { [key: string]: any }
  ) {
    // Track in amplitude
    amplitude.track(event, props, opts);
  }

  /**
   * identify Streaks
   */
  public async identifyStreak(
    userId: Object,
    streak: IStreak,
  ) {
    this.identifyOnce(userId, {
      Streaks: streak.current,
      StreaksUpdatedAt: formatMDY(streak.updatedDate, 'MM/DD/YYYY')
    })
  }
}

export default new AnalyticsService();
