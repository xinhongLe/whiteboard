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
    <div class="white-board-box" ref="whiteboardBox">
        <WhiteBoard :options="options" ref="whiteboard" />
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from "vue";
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
        const resize = () => {
            const { x, y } = whiteboardBox.value.getBoundingClientRect();
            options.value = {
                offsetX: x,
                offsetY: y
            };
        }
        onMounted(() => {
            resize();

            window.addEventListener("resize", resize);

            whiteboard.value.setOptionType(OPTION_TYPE.PROTRACTOR);
        });
        onUnmounted(() => {
            window.removeEventListener("resize", resize);
        });
        const setZoom = (zoom: number) => {
            whiteboard.value.setZoom(zoom);
            whiteboard.value.render();
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
            reduceLineWidth
        }
    }
});
</script>

<style lang="scss">
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
    height: 600px;
}
</style>
