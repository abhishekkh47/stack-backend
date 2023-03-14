import * as amplitude from '@amplitude/analytics-node';
import Config from "../../config";

class AnalyticsService {
    /**
     * Initializes the analytics service
     */
    public async init() {
        // amplitude initialization
        amplitude.init(Config.AMPLITUDE_KEY);
    }

    /**
     * Send an event to the analytics service
     * @param event The event to send
     * @param properties Optional properties to send
     */
    public async sendEvent(event: string, properties?: { [key: string]: string }) {
        // Track in amplitude
        amplitude.track(event, undefined, properties);
    }
}
export default new AnalyticsService();
