import { defineConfig } from "wxt";
import { validateEnvVars } from "./lib/env";

validateEnvVars();

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
	manifest: {
		name: "GitMarks",
		permissions: ["storage"],
		host_permissions: ["https://github.com/*", "https://api.github.com/*"],
	},
	autoIcons: {
		baseIconPath: "public/icon.svg",
	},
	outDirTemplate: "{{browser}}-mv{{manifestVersion}}",
});
