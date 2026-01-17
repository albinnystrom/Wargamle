import { parseGuess } from "../utils/formatting.js";

export function addHover(div, unit) {
    const data = Object.fromEntries(
        Object.entries(unit).map(([k, v]) => [k, parseGuess(v)])
    );

    let tooltip;
    let rendered = false;

    div.addEventListener("mouseenter", (e) => {
        if (!tooltip) {
            tooltip = document.createElement("pre");
            tooltip.className = "json-tooltip prettyprint lang-json";
            document.body.appendChild(tooltip);
        }

        if (!rendered) {
            tooltip.textContent = JSON.stringify(data, null, 2);

            if (window.PR && PR.prettyPrint) {
                PR.prettyPrint();
            }

            rendered = true;
        }

        tooltip.style.display = "block";
        positionTooltip(e);
    });

    div.addEventListener("mousemove", positionTooltip);

    div.addEventListener("mouseleave", () => {
        if (tooltip) {
            tooltip.style.display = "none";
        }
    });

    function positionTooltip(e) {
        if (!tooltip) return;

        const margin = 12;

        // Make sure tooltip is measurable
        tooltip.style.display = "block";
        tooltip.style.visibility = "hidden";

        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let top;
        let left;

        // Vertical positioning: below or above
        if (e.clientY + margin + tooltipRect.height <= viewportHeight) {
            // Enough space below
            top = e.clientY + margin;
        } else {
            // Place above
            top = e.clientY - margin - tooltipRect.height;
        }

        // Horizontal positioning: clamp within viewport
        left = e.clientX + margin;

        if (left + tooltipRect.width > viewportWidth) {
            left = viewportWidth - tooltipRect.width - margin;
        }

        if (left < margin) {
            left = margin;
        }

        tooltip.style.left = `${left + window.scrollX}px`;
        tooltip.style.top = `${top + window.scrollY}px`;

        tooltip.style.visibility = "visible";
    }
}
