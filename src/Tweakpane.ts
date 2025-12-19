import { Pane } from "tweakpane";

// Define type for what tweakpane settings should look like
export type tweakpaneSettings = {
    followMouse: boolean;
    useNewHue: boolean;
    hue: number;
};

export class Tweakpane {
    settings: tweakpaneSettings;

    private pane;

    constructor() {
        this.settings = {
            followMouse: true,
            useNewHue: false,
            hue: 0,
        };

        this.pane = new Pane({
            title: "Scene",
            expanded: true,
        });

        this.hidePane();

        this.pane.addBinding(this.settings, "followMouse", {
            label: "Follow Mouse",
        });

        const coloring = this.pane.addFolder({
            title: "Color",
            expanded: true,
        });

        const customToggle = coloring.addBinding(this.settings, "useNewHue", {
            label: "Custom Hue",
        });

        const hueSlider = coloring.addBinding(this.settings, "hue", {
            label: "Hue",
            min: 0,
            max: 360,
            step: 1,
            hidden: true,
        });

        // Hide the custom hue slider when not needed
        customToggle.on("change", (event) => {
            hueSlider.hidden = !event.value;
            this.pane.refresh();
        });
    }

    hidePane = () => {
        this.pane.hidden = true;
    };

    unhidePane = () => {
        this.pane.hidden = false;
    }
}
