# mwihitebard

## 插件安装
```shell
npm install mwhiteboard --save
```

## 插件使用
```html
<template>
    <div class="white-board-box" ref="whiteboardBox">
        <WhiteBoard :options="options" ref="whiteboard" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import WhiteBoard, { OPTION_TYPE } from "mwhiteboard";

const whiteboard = ref();
const whiteboardBox = ref();
const options = ref({
    offsetX: 0,
    offsetY: 0
});

const resize = () => {
    // 窗口发生变化重新计算距离
    const { x, y } = whiteboardBox.value.getBoundingClientRect();
    options.value = {
        offsetX: x,
        offsetY: y
    };
}

onMounted(() => {
    // 初始化黑板
    resize();
    window.addEventListener("resize", resize);
    whiteboard.value.setOptionType(OPTION_TYPE.PEN);
});
</script>

<style>
.white-board-box {
    width: 100%;
    height: 600px;
}
</style>
```

## 黑板操作模式
```ts
export enum OPTION_TYPE {
    PEN = "PEN", // 画笔
    MOUSE = "MOUSE", // 移动和缩放
    CLEAR = "CLEAR", // 清空画板
    ERASER = "ERASER", // 橡皮擦
    COMPASS = "COMPASS", // 圆规
    RULER = "RULER", // 直尺
    PROTRACTOR = "PROTRACTOR", // 量角器
}
```

## 黑板属性
| 属性 | 描述 | 类型 | 默认 |
| ----------- | ----------- | ----------- | ----------- |
| options | 配置参数(浏览器可视区域左上角距离) | { offsetX: number; offsetX: number; } | { offsetX: 0, offsetY: 0 } |

## 黑板事件
| 事件名 | 描述 | 回调参数 |
| ----------- | ----------- | ----------- |
| scrollChange | 当发生滚动是触发回调 | (scroll: { scrollX: number, scrollY: number }) |
| zoomChange | 当发生缩放是触发回调 | (zoom: number) |

## 黑板开放的方法
| 方法 | 描述 | 类型 |
| ----------- | ----------- | ----------- |
| setScroll | 设置画布上下左右的滑动 | (x: number, y: number) => void |
| setZoom | 设置画布缩放(最小0.1) | (zoom: number) => void |
| setOptionType | 设置绘制的模式 | (type: OPTION_TYPE) => void |
| setLineWidth | 设置画笔粗细 | (width: number) => void |
| setDrawColor | 设置画笔颜色 | (color: string) => void |
| render | 绘制渲染 | () => void |
| getElements | 获取绘制元素集合 | () => IElement[] |
| setElements | 设置绘制元素集合 | (elements: IElement[]) => void |
| reset | 复位 | () => void |
| clear | 清空元素 | () => void |


------------------------------------------
***【注】使用黑板时不要存在滚动轴。***