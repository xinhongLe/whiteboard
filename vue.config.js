const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
    transpileDependencies: true,
    productionSourceMap: false,
    css: { extract: false },
    configureWebpack: {
        externals:
            process.env.NODE_ENV === "development"
                ? []
                : ["vue", "core-js", "lodash", "perfect-freehand"]
    }
});
