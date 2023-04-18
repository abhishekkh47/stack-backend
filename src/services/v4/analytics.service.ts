import * as amplitude from "@amplitude/analytics-node";
import Config from "@app/config";

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
  public identifyOnce(userId: string, key: string, value: any) {
    const identifyObj = new amplitude.Identify();
    identifyObj.setOnce(key, value);

    amplitude.identify(identifyObj, {
      user_id: userId,
    });
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
}
export default new AnalyticsService();
