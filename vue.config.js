const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
    transpileDependencies: true,
    productionSourceMap: false,
    css: { extract: false },
    chainWebpack: config => {
        config.module
            .rule("images")
            .test(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/)
            .set("parser", {
                dataUrlCondition: {
                    maxSize: 1000 * 1024 // 1000KiB
                }
            })
        if (process.env.NODE_ENV === "production") {
            // 移除 prefetch 插件
            config.plugins.delete("prefetch");
            // 移除 preload 插件
            config.plugins.delete("preload");
        }
    },
    configureWebpack: {
        externals:
            process.env.NODE_ENV === "development"
                ? []
                : ["vue", "core-js", "lodash", "perfect-freehand"]
    },
});
