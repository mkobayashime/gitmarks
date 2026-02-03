import { syncAllConnections } from "../lib/sync/sync-all.ts";

export default defineBackground(() => {
	const SYNC_ALARM_NAME = "gitmarks-sync";
	const SYNC_INTERVAL_MINUTES = 15;

	browser.runtime.onInstalled.addListener(() => {
		void browser.alarms.create(SYNC_ALARM_NAME, {
			periodInMinutes: SYNC_INTERVAL_MINUTES,
		});
	});

	browser.alarms.onAlarm.addListener((alarm) => {
		if (alarm.name === SYNC_ALARM_NAME) {
			void syncAllConnections();
		}
	});
});
