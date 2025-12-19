import type { Tweakpane } from "./Tweakpane";
import type { SceneInfo } from "./utils";

export default class LoadScreen {
    finishedLoading = false;
    
    // Tracks how much stuff is loaded.
    private sceneInfo: SceneInfo;
    
    // References to handle loading bar/screen.
    private loadingBar = document.getElementById("loader-bar-fill");
    private loadingContainer = document.getElementById("loader-container");

    // Reference needed to unhide tweakpane when finished loading.
    private pane: Tweakpane;
    
    constructor (sceneInfo: SceneInfo, pane: Tweakpane) {
        this.sceneInfo = sceneInfo;
        this.pane = pane;
    }


    loadingPercent(): number {
        return (this.sceneInfo.loadedCount / (this.sceneInfo.animalCount + this.sceneInfo.grassCount)) * 100;
    }

    recalculateLoad() {
        let load = this.loadingPercent();

        this.loadingBar?.style.setProperty("width", load + "%");

        if (load >= 100) {
            this.finishedLoading = true;
            this.loadingContainer?.style.setProperty("display", "none");
            this.pane.unhidePane();
        }
    }
}