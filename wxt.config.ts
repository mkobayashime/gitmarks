import { defineConfig } from "wxt";
import { validateEnvVars } from "./lib/env";
import packageJSON from "./package.json";
import tailwind from "@tailwindcss/vite";

validateEnvVars();

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
	manifest: {
		name: packageJSON.name,
		description: packageJSON.description,
		version: packageJSON.version,
		permissions: ["storage", "bookmarks", "alarms"],
		host_permissions: ["https://github.com/*", "https://api.github.com/*"],
	},
	autoIcons: {
		baseIconPath: "public/icon.svg",
	},
	outDirTemplate: "{{browser}}-mv{{manifestVersion}}",
	vite: () => ({
		plugins: [tailwind()],
	}),
});
