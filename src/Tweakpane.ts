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

        this.pane.addBinding(this.settings, "followMouse");

        const coloring = this.pane.addFolder({
            title: "Animals",
            expanded: true,
        });

        coloring.addBinding(this.settings, "useNewHue", {
            label: "Use Custom Hue",
        });

        coloring.addBinding(this.settings, "hue", {
            label: "Hue",
            min: 0,
            max: 360,
            step: 1,
        });
    }
}
