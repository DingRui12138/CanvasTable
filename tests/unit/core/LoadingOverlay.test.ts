import { LoadingOverlay } from "@/core/LoadingOverlay";
import type { TableTheme } from "@/types";
import { zhCN } from "@/locale";
import { createMockTheme } from "../helpers/mockFactories";

/** 读取内联样式全文——jsdom 会把颜色序列化成 rgb(...)，用正则兼容两种写法 */
function styleText(el: HTMLElement): string {
  return el.getAttribute("style") ?? "";
}

function colorPattern(hex: string): RegExp {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const r = parseInt(m[1]!, 16);
  const g = parseInt(m[2]!, 16);
  const b = parseInt(m[3]!, 16);
  // jsdom 会把 hex 序列化成 rgb(...) 或 rgba(...)
  return new RegExp(`${hex}|rgba?\\(\\s*${r},\\s*${g},\\s*${b}\\s*[,)]`, "i");
}

type Probe = {
  element: HTMLDivElement;
  spinnerElement: HTMLDivElement;
  textElement: HTMLDivElement;
};

function probe(overlay: LoadingOverlay): Probe {
  return overlay as unknown as Probe;
}

function themeWithLoading(): TableTheme {
  const theme = createMockTheme();
  theme.colors.loading = {
    background: "#112233",
    spinnerBorder: "#445566",
    spinnerActive: "#778899",
    text: "#aabbcc",
  };
  return theme;
}

let wrapper: HTMLDivElement;

beforeEach(() => {
  wrapper = document.createElement("div");
  document.body.appendChild(wrapper);
});

afterEach(() => {
  document.body.innerHTML = "";
  document.getElementById("canvas-table-loading-animation")?.remove();
});

describe("LoadingOverlay", () => {
  describe("构造", () => {
    it("把遮罩挂到 wrapper 上，内含 spinner 与文本两个子元素", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());

      const { element, spinnerElement, textElement } = probe(overlay);
      expect(wrapper.children).toHaveLength(1);
      expect(wrapper.children[0]).toBe(element);
      expect(element.children).toHaveLength(2);
      expect(element.children[0]).toBe(spinnerElement);
      expect(element.children[1]).toBe(textElement);
    });

    it("初始为隐藏状态", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());

      expect(probe(overlay).element.style.display).toBe("none");
      expect(overlay.isVisible()).toBe(false);
    });

    it("构造时不写入文本，首次 show() 才填充 locale 文案", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());

      // 已知行为：构造函数未调用 updateText()，初始 textContent 为空串
      expect(probe(overlay).textElement.textContent).toBe("");

      overlay.show();

      expect(probe(overlay).textElement.textContent).toBe(zhCN.loadingText);
    });

    it("构造时传入的自定义文本在首次 show() 时生效", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme(), { text: "加载中……" });

      overlay.show();

      expect(probe(overlay).textElement.textContent).toBe("加载中……");
    });

    it("遮罩铺满容器且位于最上层", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());

      const css = styleText(probe(overlay).element).replace(/\s+/g, "");
      expect(css).toContain("position:absolute");
      expect(css).toContain("top:0");
      expect(css).toContain("left:0");
      expect(css).toContain("right:0");
      expect(css).toContain("bottom:0");
      expect(css).toContain("z-index:9999");
    });
  });

  describe("主题应用", () => {
    it("主题缺少 loading 分组时使用内置兜底色", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());

      const { element, spinnerElement, textElement } = probe(overlay);
      expect(styleText(element)).toMatch(colorPattern("#ffffff"));
      expect(styleText(spinnerElement)).toMatch(colorPattern("#d9d9d9"));
      expect(styleText(spinnerElement)).toMatch(colorPattern("#1890ff"));
      expect(textElement.style.color).toBe("rgb(51, 51, 51)");
    });

    it("主题提供 loading 分组时优先使用主题色", () => {
      const overlay = new LoadingOverlay(wrapper, themeWithLoading());

      const { element, spinnerElement, textElement } = probe(overlay);
      expect(styleText(element)).toMatch(colorPattern("#112233"));
      expect(styleText(spinnerElement)).toMatch(colorPattern("#445566"));
      expect(styleText(spinnerElement)).toMatch(colorPattern("#778899"));
      expect(textElement.style.color).toBe("rgb(170, 187, 204)");
    });

    it("spinner 与文本继承主题字体与旋转动画", () => {
      const theme = createMockTheme();

      const overlay = new LoadingOverlay(wrapper, theme);

      const { spinnerElement, textElement } = probe(overlay);
      expect(spinnerElement.style.animation).toContain("canvas-table-spin");
      expect(textElement.style.fontFamily).toContain(theme.font.family.split(",")[0]!);
    });

    it("setTheme 会重新应用主题色", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());

      overlay.setTheme(themeWithLoading());

      expect(styleText(probe(overlay).element)).toMatch(colorPattern("#112233"));
    });
  });

  describe("动画样式注入", () => {
    it("首次构造注入 keyframes 样式标签", () => {
      new LoadingOverlay(wrapper, createMockTheme());

      const style = document.getElementById("canvas-table-loading-animation");
      expect(style).not.toBeNull();
      expect(style!.textContent).toContain("@keyframes canvas-table-spin");
    });

    it("重复构造不会注入重复的样式标签", () => {
      new LoadingOverlay(wrapper, createMockTheme());
      const second = document.createElement("div");
      document.body.appendChild(second);
      new LoadingOverlay(second, createMockTheme());

      expect(document.querySelectorAll("#canvas-table-loading-animation")).toHaveLength(1);
    });
  });

  describe("显示与隐藏", () => {
    it("show() 显示遮罩并回落到配置文本", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme(), { text: "稍等" });

      overlay.show();

      expect(probe(overlay).element.style.display).toBe("flex");
      expect(probe(overlay).textElement.textContent).toBe("稍等");
      expect(overlay.isVisible()).toBe(true);
    });

    it("show(text) 覆盖当前文本", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());

      overlay.show("正在保存");

      expect(probe(overlay).textElement.textContent).toBe("正在保存");
    });

    it("show() 无参时回退到 locale 文本", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());
      overlay.show("临时文案");

      overlay.show();

      expect(probe(overlay).textElement.textContent).toBe(zhCN.loadingText);
    });

    it("hide() 隐藏遮罩", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());
      overlay.show();

      overlay.hide();

      expect(probe(overlay).element.style.display).toBe("none");
      expect(overlay.isVisible()).toBe(false);
    });

    it("setConfig 更新文本并立即生效", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());
      overlay.show();

      overlay.setConfig({ text: "重新加载" });

      expect(probe(overlay).textElement.textContent).toBe("重新加载");
    });

    it("setConfig 传空对象时回退到 locale 文本", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme(), { text: "旧文案" });

      overlay.setConfig({});

      expect(probe(overlay).textElement.textContent).toBe(zhCN.loadingText);
    });
  });

  describe("销毁", () => {
    it("destroy() 把遮罩从 DOM 移除", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());

      overlay.destroy();

      expect(wrapper.children).toHaveLength(0);
    });

    it("重复 destroy 不报错", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());
      overlay.destroy();

      expect(() => overlay.destroy()).not.toThrow();
    });
  });

  describe("事件阻断", () => {
    it("鼠标事件不会冒泡到容器", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());
      const { element } = probe(overlay);
      const onWrapper = jest.fn();
      wrapper.addEventListener("mousedown", onWrapper);

      element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

      expect(onWrapper).not.toHaveBeenCalled();
    });

    it("click / dblclick / keydown / keyup / mouseup 均被阻断", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());
      const { element } = probe(overlay);
      const onWrapper = jest.fn();
      const types = ["click", "dblclick", "keydown", "keyup", "mouseup"];
      for (const type of types) {
        wrapper.addEventListener(type, onWrapper);
      }

      for (const type of types) {
        element.dispatchEvent(new Event(type, { bubbles: true }));
      }

      expect(onWrapper).not.toHaveBeenCalled();
    });

    it("wheel 事件被阻断并阻止默认行为（防止滚动穿透）", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());
      const { element } = probe(overlay);
      const onWrapper = jest.fn();
      wrapper.addEventListener("wheel", onWrapper);
      const event = new Event("wheel", { bubbles: true, cancelable: true });

      element.dispatchEvent(event);

      expect(onWrapper).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it("touchmove 事件被阻断并阻止默认行为", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());
      const { element } = probe(overlay);
      const onWrapper = jest.fn();
      wrapper.addEventListener("touchmove", onWrapper);
      const event = new Event("touchmove", { bubbles: true, cancelable: true });

      element.dispatchEvent(event);

      expect(onWrapper).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it("touchstart / touchend 被阻断", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());
      const { element } = probe(overlay);
      const onWrapper = jest.fn();
      wrapper.addEventListener("touchstart", onWrapper);
      wrapper.addEventListener("touchend", onWrapper);

      element.dispatchEvent(new Event("touchstart", { bubbles: true }));
      element.dispatchEvent(new Event("touchend", { bubbles: true }));

      expect(onWrapper).not.toHaveBeenCalled();
    });

    it("contextmenu 被阻断并阻止默认菜单", () => {
      const overlay = new LoadingOverlay(wrapper, createMockTheme());
      const { element } = probe(overlay);
      const onWrapper = jest.fn();
      wrapper.addEventListener("contextmenu", onWrapper);
      const event = new Event("contextmenu", { bubbles: true, cancelable: true });

      element.dispatchEvent(event);

      expect(onWrapper).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });
  });
});
