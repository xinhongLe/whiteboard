<template>
    <button @click="setZoom(++zoom)">放大</button>
    <button @click="setZoom(--zoom)">缩小</button>
    <button @click="setOptionType(OPTION_TYPE.ERASER)">橡皮</button>
    <button @click="setOptionType(OPTION_TYPE.PEN)">画</button>
    <button @click="setOptionType(OPTION_TYPE.MOUSE)">移动</button>
    <button @click="setOptionType(OPTION_TYPE.COMPASS)">圆规</button>
    <button @click="setOptionType(OPTION_TYPE.RULER)">直尺</button>
    <button @click="setOptionType(OPTION_TYPE.PROTRACTOR)">量角器</button>
    <button @click="addLineWidth()">变粗</button>
    <button @click="reduceLineWidth()">变细</button>
    <button @click="getElements()">数据</button>
    <button @click="reset()">复位</button>
    <button @click="undo()" :disabled="!canUndo">撤销</button>
    <button @click="redo()" :disabled="!canRedo">恢复</button>
    &nbsp;<span>滚动 ({{(-scrollX).toFixed(0)}}/{{(-scrollY).toFixed(0)}})</span> <span>缩放 {{(zoom * 100).toFixed(0)}}%</span>
    <div class="white-board-box" ref="whiteboardBox">
        <WhiteBoard
            :options="options"
            ref="whiteboard"
            @scrollChange="scrollChange"
            @zoomChange="zoomChange"
            @closeTool="closeTool"
        />
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from "vue";
import WhiteBoard, { OPTION_TYPE } from "./components/whiteboard";

export default defineComponent({
    name: "App",
    components: {
        WhiteBoard
    },
    setup() {
        const whiteboard = ref();
        const whiteboardBox = ref();
        let width = 5;
        const options = ref({
            offsetX: 0,
            offsetY: 0
        });
        const zoom = ref(1);
        const scrollX = ref(0);
        const scrollY = ref(0);
        const resize = () => {
            const { x, y } = whiteboardBox.value.getBoundingClientRect();
            options.value = {
                offsetX: x,
                offsetY: y
            };
        };
        onMounted(() => {
            resize();

            window.addEventListener("resize", resize);

            whiteboard.value.setOptionType(OPTION_TYPE.PEN);
        });
        onUnmounted(() => {
            window.removeEventListener("resize", resize);
        });
        const setZoom = (zoom: number) => {
            whiteboard.value.setZoom(zoom);
        };
        const setOptionType = (type: OPTION_TYPE) => {
            whiteboard.value.setOptionType(type);
        };
        const getElements = () => {
            console.log(whiteboard.value.getElements());
        };
        const addLineWidth = () => {
            width += 5;
            whiteboard.value.setLineWidth(width);
        };
        const reduceLineWidth = () => {
            if (width === 5) return;
            width -= 5;
            whiteboard.value.setLineWidth(width);
        };
        const scrollChange = (scroll: { scrollX: number; scrollY: number }) => {
            scrollX.value = scroll.scrollX;
            scrollY.value = scroll.scrollY;
        };

        const zoomChange = (value: number) => {
            zoom.value = value
        };

        const reset = () => {
            whiteboard.value.reset();
        };

        const undo = () => {
            whiteboard.value.undo();
        };

        const redo = () => {
            whiteboard.value.redo();
        };

        const canUndo = computed(() => whiteboard.value && whiteboard.value.canUndo);
        const canRedo = computed(() => whiteboard.value && whiteboard.value.canRedo);

        const closeTool = () => {
            console.log("关闭tool");
        };

        return {
            whiteboard,
            whiteboardBox,
            options,
            setZoom,
            zoom,
            setOptionType,
            OPTION_TYPE,
            getElements,
            addLineWidth,
            reduceLineWidth,
            scrollChange,
            zoomChange,
            scrollX,
            scrollY,
            reset,
            undo,
            redo,
            canUndo,
            canRedo,
            closeTool
        };
    }
});
</script>

<style lang="scss">
body {
    overflow: hidden;
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}

.white-board-box {
    width: 100%;
    height: 100vh;
}
</style>
