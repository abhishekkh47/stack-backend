import * as amplitude from '@amplitude/analytics-node';
import Config from "../../config";

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
