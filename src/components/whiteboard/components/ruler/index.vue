<template>
    <div class="ruler-container" ref="ruler">
        <div
            class="ruler-box"
            :style="{
                width: `${width}px`,
                left: `${x}px`,
                top: `${y}px`,
                transform: `rotate(${angle}deg)`
            }"
        >
            <div class="ruler-scale"></div>
            <div class="ruler-buttons">
                <div class="ruler-button ruler-close" @click="closeRuler()">
                    <img src="./images/close.svg" alt="" />
                </div>
                <div class="ruler-angle-text">{{ viewText === "angle" ? angle  + "°" : "" }}</div>
                <div class="ruler-button ruler-rotate">
                    <img src="./images/rotate.svg" alt="" />
                </div>
                <div class="ruler-button ruler-resize">
                    <img src="./images/resize.svg" alt="" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, PropType, ref, defineProps, defineEmits } from "vue";
import { ICanvasConfig } from "../../types";
import { getAngle } from "../../utils";

const props = defineProps({
    canvasConfig: {
        type: Object as PropType<ICanvasConfig>,
        required: true
    }
});

const emit = defineEmits(["close"]);

const canvasConfig = computed(() => props.canvasConfig);

const width = ref(500);
const x = ref(0);
const y = ref(0);
const angle = ref(0);
const ruler = ref();
const mode = ref("");
const viewText = ref("");
const startPoint = { x: 0, y: 0 };
let startAngle = 0;

const handleMouseDown = (event: PointerEvent) => {
    event.stopPropagation();
    const mouseX = event.clientX - canvasConfig.value.offsetX;
    const mouseY = event.clientY - canvasConfig.value.offsetY;
    startPoint.x = mouseX;
    startPoint.y = mouseY;
    if (
        event.target &&
        (event.target as Element).className === "ruler-buttons"
    ) {
        // move
        mode.value = "move";
        viewText.value = "";
    }

    if (
        event.target &&
        (event.target as Element).className === "ruler-button ruler-rotate"
    ) {
        // rotate
        mode.value = "rotate";
        viewText.value = "angle";
        startAngle = getAngle(mouseX - x.value, mouseY - y.value);
    }

    if (
        event.target &&
        (event.target as Element).className === "ruler-button ruler-resize"
    ) {
        // resize
        mode.value = "resize";
        viewText.value = "";
    }

    document.addEventListener("pointermove", handleMouseMove);
    document.addEventListener("pointerup", handleEnd);
};

const handleMouseMove = (event: PointerEvent) => {
    event.stopPropagation();
    const mouseX = event.clientX - canvasConfig.value.offsetX;
    const mouseY = event.clientY - canvasConfig.value.offsetY;

    if (mode.value === "move") {
        x.value += mouseX - startPoint.x;
        y.value += mouseY - startPoint.y;
    }

    if (mode.value === "rotate") {
        console.log(angle.value);
        const targetAngle = getAngle(mouseX - x.value, mouseY - y.value);
        angle.value +=  targetAngle - startAngle;
        startAngle = targetAngle;
    }

    if (mode.value === "resize") {
        width.value += mouseX - startPoint.x;
        if (width.value < 500) width.value = 500;
    }

    startPoint.x = mouseX;
    startPoint.y = mouseY;
};

const handleEnd = () => {
    mode.value = "";
    document.removeEventListener("pointermove", handleMouseMove);
    document.removeEventListener("pointerup", handleEnd);
};

const closeRuler = () => {
    emit("close");
}

onMounted(() => {
    if (ruler.value) {
        x.value = ruler.value.clientWidth / 2 - 250;
        y.value = ruler.value.clientHeight / 2 - 30;
    }

    document.addEventListener("pointerdown", handleMouseDown);
});
</script>

<style lang="scss" scoped>
.ruler-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}

.ruler-box {
    position: absolute;
    transform-origin: top left;
}

.ruler-scale {
    height: 20px;
    background-image: url(./images/scale.png);
    background-repeat: repeat-x;
    background-size: 600px 24px;
    background-color: rgba(0, 0, 0, 0.05);
}

.ruler-buttons {
    height: 87px;
    display: flex;
    align-items: center;
    cursor: move;
    background-color: #f9f9f9;
}

.ruler-button {
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
    height: 48px;
    width: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
    img {
        display: block;
        width: 32px;
        height: 32px;
        -webkit-user-drag: none;
        pointer-events: none;
    }

    &.ruler-close {
        margin-left: 20px;
        cursor: pointer;
    }

    &.ruler-resize {
        margin-right: 20px;
        cursor: default;
    }

    &.ruler-rotate {
        margin-right: 20px;
        cursor: default;
    }
}

.ruler-angle-text {
    flex: 1;
    font-size: 28px;
    font-weight: 600;
    color: #666666;
    text-align: center;
    line-height: 30px;
    margin-left: 48px;
    margin-right: 48px;
    pointer-events: none;
}
</style>
