<div align="center">

# 💸 Currency Sky Background

### Interactive, animated currency terrain for Framer

A living landscape made of **currency symbols**, flowing topographic contours and fluid cursor reactions.

[![Live Preview](https://img.shields.io/badge/Live%20Preview-Explore%20the%20effect-111111?style=for-the-badge)](https://currencyskybackground.framer.website/)
[![Framer](https://img.shields.io/badge/Framer-Code%20Component-0055FF?style=for-the-badge)](https://www.framer.com/)
[![Author](https://img.shields.io/badge/Made%20by-Karim%20Saif-EBC56D?style=for-the-badge)](https://github.com/karimsaif0)

**[✨ Try the live demo](https://currencyskybackground.framer.website/)** · **[📦 Component source](./KarimSaifCurrencySkyBackground.tsx)** · **[💬 Contact](mailto:karimsaif010@gmail.com)**

</div>

---

## A landscape made of symbols

**Currency Sky Background** renders a dense field of glyphs as a moving, procedural terrain. Layered wave functions shape its elevation contours, while the pointer gently bends and displaces the landscape. It creates a sophisticated editorial backdrop without image assets, WebGL, or third-party animation packages.

Ideal for **fintech websites, crypto and Web3 launches, premium SaaS interfaces, interactive hero sections, generative portfolios, AI products and experimental typography**.

## ✨ Features

| Experience | Details |
| --- | --- |
| **Living terrain** | Multi-layer procedural wave field with animated topographic contour bands |
| **Cursor interaction** | Toggle on/off and customize radius, strength, and smoothness |
| **10 glyph styles** | Mixed Currency, Dollar, Euro, Pound, Yen, Bitcoin, Symbols, Binary, ASCII, and Custom |
| **Personalized palette** | Background plus four independently adjustable glyph colors |
| **Precision controls** | Terrain scale, glyph spacing, font size, contour width, contrast, brightness and opacity |
| **Responsive by design** | Recalculates the terrain for the component's actual dimensions |
| **Performance aware** | Adjustable frame rate, maximum glyph cells, DPR cap, and canvas pixel safeguards |
| **Respectful motion** | Reduced-motion support, static rendering, and automatic offscreen/tab pause |
| **Zero animation dependencies** | React + Framer APIs + browser Canvas 2D |

## 🚀 Add it to Framer

1. Open your Framer project.
2. Create a new **Code Component** named `KarimSaifCurrencySkyBackground.tsx`.
3. Paste the complete source from **[KarimSaifCurrencySkyBackground.tsx](./KarimSaifCurrencySkyBackground.tsx)**.
4. Add the component to your canvas and set its width/height.
5. Use the Framer properties panel to customize colors, glyphs, animation and cursor behavior.

> This repository contains the Framer code-component source. It is meant to be pasted into a Framer project, not run as a standalone web app.

## 🎛️ Customize

**Visuals** — Background, dark/low/mid/bright glyph colors, overall opacity, glyph preset, four custom symbols, font size and CSS font family.

**Terrain** — Wave speed, cell width/height, terrain scale, contour spacing, contour width, contrast, and brightness.

**Interaction** — Cursor Effect toggle, cursor radius, strength, and smoothness. Set **Speed = 0** for a still landscape that reacts only to the pointer.

**Performance** — Target frame rate, maximum pixel ratio, and glyph-cell count. For a large hero, begin with the included defaults and adjust until the motion feels right on your devices.

## 🧠 How it works

1. **Sample:** A layered trigonometric field assigns intensity to glyph positions.
2. **Contour:** Periodic bands of intensity become bright terrain highlights.
3. **Distort:** Pointer proximity offsets glyph coordinates and wave sampling.
4. **Draw:** The Canvas 2D renderer batches glyphs by color and redraws as needed.
5. **Pause:** Visibility, reduced-motion preferences, and static-renderer state govern the animation.

## ⚙️ Technical notes

- Built as a **native Framer React/TypeScript code component**.
- Uses `useIsStaticRenderer` and `useReducedMotion`.
- Uses `ResizeObserver`, `IntersectionObserver`, and page visibility handling.
- Cleans up observers, browser listeners, and requestAnimationFrame callbacks.
- Includes a deterministic still frame for static rendering.
- Motion and rendering results should be tested in your own Framer project before Marketplace submission.

## 🔗 Links

- **Interactive preview:** https://currencyskybackground.framer.website/
- **GitHub:** https://github.com/karimsaif0
- **Repository:** https://github.com/karimsaif0/Currency-Sky-Background-Interactive-Animated-Terrain-Framer-Component-
- **Framer:** https://www.framer.com/

## 💛 Support & feedback

Created by **Karim Saif**.

Have a question, feedback, or an idea for your next interaction? I'd love to hear from you.

**Email:** [karimsaif010@gmail.com](mailto:karimsaif010@gmail.com)  
**GitHub:** [@karimsaif0](https://github.com/karimsaif0)

---

<div align="center">

**Made with 💛 by Karim Saif**

*Type becomes terrain. Motion becomes atmosphere.*

[Explore live preview ↗](https://currencyskybackground.framer.website/)

</div>
