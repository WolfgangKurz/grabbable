var webpack = require("webpack");
var path = require("path");

module.exports = (env, argv) => {
	return {
		entry: {
			"grabbable": "./src/grabbable.ts"
		},
		output: {
			filename: "[name].js",
			path: path.resolve(__dirname, "dist"),
		},

		resolve: {
			extensions: [".ts"],
		},

		mode: argv.mode === "development" ? "development" : "production",
		devtool: argv.mode === "development" ? "source-map" : "none",

		module: {
			rules: [
				{
					test: /\.[jt]s$/,
					exclude: /(node_modules)/,
					use: { loader: "babel-loader" }
				},
			]
		}
	};
};
