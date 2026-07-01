const pauseMenu = {

    pauseMenuUIDimensions: {
        x: 0, 
        y: 2,
        w: 20,
        h: 20
    },

    visible: false,

    pauseMenuIndex: -1,

    show: function() {
        /*
            instead of redrawing
            the entire table, only draw the placings that are missing.
        */

        const lDim = this.pauseMenuUIDimensions;

        if (!this.visible) {
            const pauseMenuBG = new UIPanel(lDim.x, lDim.y, lDim.w, lDim.h, ["textures/pause_menu/pause_menu.png"]);
            UILayer.push(pauseMenuBG);
            this.pauseMenuIndex = UILayer.length - 1;
            const volumeSlider = document.getElementById('volume-slider');
            volumeSlider.style.display = "flex";
            this.visible = true;
        }
    },

    reset: function() {
        UILayer = UILayer.filter((element, index) => index != this.pauseMenuIndex);
        const volumeSlider = document.getElementById('volume-slider');
        volumeSlider.style.display = "none";
        this.visible = false;
    }
}
