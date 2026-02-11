import tailwind from "@tailwindcss/vite";
import { defineConfig } from "wxt";
import packageJSON from "./package.json";

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
