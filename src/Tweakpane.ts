import { Pane } from "tweakpane";
import { hsvToRgb, type MouseMode } from "./utils";

// Define type for what tweakpane settings should look like
export type tweakpaneSettings = {
    mouseMode: MouseMode;
    colorMode: "random" | "custom" | "original";
    clickToPlace: boolean;
    objectSelect: "cow" | "pig" | "grass";
    hue: number;
    pauseAnimation: boolean;
};

export class Tweakpane {
    settings: tweakpaneSettings;

    private pane;

    constructor() {
        this.settings = {
            mouseMode: "follow",
            colorMode: "random",
            clickToPlace: true,
            objectSelect: "cow",
            hue: 0,
            pauseAnimation: false,
        };

        this.pane = new Pane({
            title: "Scene",
            expanded: true,
        });

        this.hidePane();

        this.pane.addBinding(this.settings, "mouseMode", {
            label: "Mouse Mode",
            options: {
                "Follow Mouse": "follow",
                "Run from Mouse": "push",
                "Orbit Mouse": "orbit",
                None: "none",
            },
        });

        const coloring = this.pane.addFolder({
            title: "Color",
            expanded: true,
        });

        const customToggle = coloring.addBinding(this.settings, "colorMode", {
            label: "Color Select Mode",
            options: {
                Random: "random",
                "Custom Hue": "custom",
                Original: "original",
            },
        });

        const hueSlider = coloring.addBinding(this.settings, "hue", {
            label: "Hue",
            min: 0,
            max: 360,
            step: 1,
            hidden: true,
        });

        hueSlider.on("change", () => {
            let huePreview: any = document.getElementsByClassName("tp-sldtxtv_t")[0];

            let rgb = hsvToRgb(this.settings.hue, 1, 1);

            huePreview.style.background = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        });

        // Hide the custom hue slider when not needed
        customToggle.on("change", (event) => {
            if (event.value === "custom") {
                hueSlider.hidden = false;
            } else {
                hueSlider.hidden = true;
            }
            this.pane.refresh();
        });

        const objects = this.pane.addFolder({
            title: "Objects",
            expanded: true,
        });

        objects.addBinding(this.settings, "pauseAnimation", {
            label: "Pause Animals",
        })

        const placementEnabled = objects.addBinding(this.settings, "clickToPlace", {
            label: "Click to Create",
        });

        const placementSelection = objects.addBinding(this.settings, "objectSelect", {
            label: "Object Selection",
            options: {
                Cow: "cow",
                Pig: "pig",
                Grass: "grass",
            },
        });

        placementEnabled.on("change", (event) => {
            placementSelection.hidden = !event.value;
            this.pane.refresh();
        });
    }

    hidePane = () => {
        this.pane.hidden = true;
    };

    unhidePane = () => {
        this.pane.hidden = false;
    };
}
