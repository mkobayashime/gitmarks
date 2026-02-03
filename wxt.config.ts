import { defineConfig } from "wxt";
import { validateEnvVars } from "./lib/env";

validateEnvVars();

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	manifest: {
		name: "GitMarks",
		permissions: ["storage"],
		host_permissions: ["https://github.com/*", "https://api.github.com/*"],
	},
	outDirTemplate: "{{browser}}-mv{{manifestVersion}}",
});
