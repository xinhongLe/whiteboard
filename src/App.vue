<template>
    <button @click="setZoom(++zoom)">放大</button>
    <button @click="setZoom(--zoom)">缩小</button>
    <button @click="setOptionType(OPTION_TYPE.ERASER)">橡皮</button>
    <button @click="setOptionType(OPTION_TYPE.PEN)">画</button>
    <button @click="setOptionType(OPTION_TYPE.MOUSE)">移动</button>
    <button @click="setToolTypes(OPTION_TYPE.COMPASS)">圆规</button>
    <button @click="setToolTypes(OPTION_TYPE.RULER)">直尺</button>
    <button @click="setToolTypes(OPTION_TYPE.PROTRACTOR)">量角器</button>
    <button @click="setToolTypes(OPTION_TYPE.RIGHTTRIANGLE)">直角三角形</button>
    <button @click="setToolTypes(OPTION_TYPE.ISOSCELESTRIANGLE)">等腰直角三角形</button>
    <button @click="addLineWidth()">变粗</button>
    <button @click="reduceLineWidth()">变细</button>
    <button @click="getElements()">数据</button>
    <button @click="reset()">复位</button>
    <button @click="clear()">清空</button>
    <button @click="undo()" :disabled="!canUndo">撤销</button>
    <button @click="redo()" :disabled="!canRedo">恢复</button>
    &nbsp;<span>滚动 ({{ (-scrollX).toFixed(0) }}/{{ (-scrollY).toFixed(0) }})</span>
    <span>缩放 {{ (zoom * 100).toFixed(0) }}%</span>
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
import WhiteBoard, { OPTION_TYPE } from "./components/whiteboard";
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref } from "vue";

export default defineComponent({
    name: "App",
    components: { WhiteBoard },
    setup() {
        let width = 5;
        const whiteboard = ref();
        const zoom = ref(1);
        const whiteboardBox = ref();
        const scrollX = ref(0);
        const scrollY = ref(0);
        const toolTypes = ref<string[]>([]);
        const options = ref({ offsetX: 0, offsetY: 0 });

        const resize = () => {
            const { x, y } = whiteboardBox.value.getBoundingClientRect();
            options.value = {
                offsetX: x,
                offsetY: y
            };
        };
        const setZoom = (zoom: number) => {
            whiteboard.value.setZoom(zoom);
        };
        const setOptionType = (type: OPTION_TYPE) => {
            whiteboard.value.setOptionType(type);
        };
        const setToolTypes = (type: OPTION_TYPE) => {
            if (toolTypes.value.includes(type)) {
                toolTypes.value = toolTypes.value.filter((item) => item !== type);
            } else {
                toolTypes.value.push(type);
            }
            whiteboard.value.setToolTypes(toolTypes.value);
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

        const clear = () => {
            whiteboard.value.clear();
        };

        const canUndo = computed(() => whiteboard.value && whiteboard.value.canUndo);
        const canRedo = computed(() => whiteboard.value && whiteboard.value.canRedo);

        const closeTool = (type: string) => {
            toolTypes.value = toolTypes.value.filter((item) => item !== type);
        };

        onMounted(() => {
            nextTick(resize);

            window.addEventListener("resize", resize);

            whiteboard.value.setOptionType(OPTION_TYPE.PEN);

            // 处理外部使用dom慢引起的笔记计算误差，延迟后再执行一下，降低误差概率
            setTimeout(resize, 2000);
        });
        onUnmounted(() => {
            window.removeEventListener("resize", resize);
        });

        return {
            whiteboard,
            whiteboardBox,
            options,
            setZoom,
            zoom,
            setOptionType,
            setToolTypes,
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
            closeTool,
            clear
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
