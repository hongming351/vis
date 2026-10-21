// lesson-01/main.js — 第 1 章入口：组装内容源、演示与渲染器
import { renderLesson } from "../shared/render.js";
import { CONTENT } from "./content.js";
import { DEMOS } from "./demos.js";

renderLesson(CONTENT, { demos: DEMOS, root: document.getElementById("app") });
