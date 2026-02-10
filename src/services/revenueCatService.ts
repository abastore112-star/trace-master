import { Purchases, LogLevel } from "@revenuecat/purchases-js";

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY;
const ENTITLEMENT_ID = "trace master Pro";

class RevenueCatService {
    private static instance: RevenueCatService;
    private isConfigured = false;

    private constructor() {
        if (import.meta.env.DEV) {
            Purchases.setLogLevel(LogLevel.Debug);
        }
    }

    public static getInstance(): RevenueCatService {
        if (!RevenueCatService.instance) {
            RevenueCatService.instance = new RevenueCatService();
        }
        return RevenueCatService.instance;
    }

    /**
     * Configure the RevenueCat SDK with the current user's ID.
     */
    public async configure(appUserId: string): Promise<void> {
        if (this.isConfigured) return;

        try {
            Purchases.configure({
                apiKey: REVENUECAT_API_KEY,
                appUserId: appUserId
            });
            this.isConfigured = true;
            console.log("RevenueCat: Configured for user", appUserId);
        } catch (error) {
            console.error("RevenueCat: Configuration failed", error);
        }
    }

    /**
     * Check if the user has the active 'trace master Pro' entitlement.
     */
    public async checkProStatus(): Promise<boolean> {
        if (!this.isConfigured) return false;

        try {
            const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
            return customerInfo.entitlements.active.hasOwnProperty(ENTITLEMENT_ID);
        } catch (error) {
            console.error("RevenueCat: Failed to fetch customer info", error);
            return false;
        }
    }

    /**
     * Present the RevenueCat Web Paywall.
     */
    public async presentPaywall(): Promise<void> {
        if (!this.isConfigured) {
            console.warn("RevenueCat: SDK not configured. Cannot show paywall.");
            return;
        }

        try {
            // This displays the RevenueCat Paywall as an overlay
            await Purchases.getSharedInstance().presentPaywall({});
        } catch (error) {
            console.error("RevenueCat: Failed to present paywall", error);
        }
    }

    /**
     * Open the Subscription Management URL.
     */
    public async openCustomerCenter(): Promise<void> {
        if (!this.isConfigured) return;

        try {
            const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
            if (customerInfo.managementURL) {
                window.open(customerInfo.managementURL, '_blank');
            } else {
                console.warn("RevenueCat: No management URL available.");
            }
        } catch (error) {
            console.error("RevenueCat: Failed to open management URL", error);
        }
    }

    /**
     * Handle logout by resetting the Purchases SDK state.
     */
    public async logout(): Promise<void> {
        if (!this.isConfigured) return;

        try {
            Purchases.getSharedInstance().close();
            this.isConfigured = false;
        } catch (error) {
            console.error("RevenueCat: Logout failed", error);
        }
    }
}

export const revenueCatService = RevenueCatService.getInstance();
