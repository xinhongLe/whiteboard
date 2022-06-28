<template>
    <button @click="setZoom(++zoom)">放大</button>
    <button @click="setZoom(--zoom)">缩小</button>
    <button @click="setOptionType(OPTION_TYPE.PEN)">画</button>
    <button @click="setOptionType(OPTION_TYPE.MOUSE)">移动</button>
    <button @click="setOptionType(OPTION_TYPE.COMPASS)">圆规</button>
    <button @click="getElements()">数据</button>
    <div class="white-board-box" ref="whiteboardBox">
        <WhiteBoard :options="options" ref="whiteboard" />
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import WhiteBoard, { OPTION_TYPE } from "./components/whiteboard";

export default defineComponent({
    name: "App",
    components: {
        WhiteBoard
    },
    setup() {
        const whiteboard = ref();
        const whiteboardBox = ref();
        const options = ref({
            offsetX: 0,
            offsetY: 0
        });
        const zoom = ref(1);
        onMounted(() => {
            const { x, y } = whiteboardBox.value.getBoundingClientRect();
            options.value = {
                offsetX: x,
                offsetY: y
            };
            whiteboard.value.setOptionType(OPTION_TYPE.COMPASS);
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
        return {
            whiteboard,
            whiteboardBox,
            options,
            setZoom,
            zoom,
            setOptionType,
            OPTION_TYPE,
            getElements
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
    width: 1000px;
    height: 600px;
}
</style>
