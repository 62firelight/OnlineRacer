const pauseMenu = {

    pauseMenuUIDimensions: {
        x: 0, 
        y: 2,
        w: 20,
        h: 20
    },

    visible: false,

    show: function() {
        /*
            instead of redrawing
            the entire table, only draw the placings that are missing.
        */

        const lDim = this.pauseMenuUIDimensions;

        if (!this.visible) {
            const pauseMenuBG = new UIPanel(lDim.x, lDim.y, lDim.w, lDim.h, ["textures/pause_menu/pause_menu.png"]);
            UILayer.push(pauseMenuBG);
            const volumeSlider = document.getElementById('volume-slider');
            volumeSlider.style.display = "flex";
            this.visible = true;
        }
    },

    reset: function() {
        clearUIPanel();
        const volumeSlider = document.getElementById('volume-slider');
        volumeSlider.style.display = "none";
        this.visible = false;
    }
}
