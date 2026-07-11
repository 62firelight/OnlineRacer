const pauseMenu = {

    pauseMenuUIDimensions: {
        x: 0, 
        y: 2,
        w: 20,
        h: 20
    },

    pauseMenuBg: undefined,

    titleScreenBtn: undefined,

    visible: false,

    pauseMenuIndex: -1,

    show: function() {
        /*
            instead of redrawing
            the entire table, only draw the placings that are missing.
        */

        const lDim = this.pauseMenuUIDimensions;

        if (!this.visible) {
            this.titleScreenBtn = new UIPanel(0, -3, 15, 5, [
                "textures/menu/quit_button_bg_0.png",
                "textures/menu/quit_button_bg_1.png"
            ]);
            this.titleScreenBtn.addText("Quit");
            this.titleScreenBtn.whenClicked = function () {
                // TODO: Implement quit button functionality
                console.log("Quit button pressed");
            };
            this.titleScreenBtn.update = function () {
                if (this.mouseHovering) {
                    this.textureIndex = 1;
                } else {
                    this.textureIndex = 0;
                }
            };
            UILayer.push(this.titleScreenBtn);
            
            this.pauseMenuBG = new UIPanel(lDim.x, lDim.y, lDim.w, lDim.h, ["textures/pause_menu/pause_menu.png"]);
            UILayer.push(this.pauseMenuBG);

            this.setVolumeCssSettingsForPauseMenu();        
            this.visible = true;
        }
    },

    reset: function() {
        UILayer.splice(UILayer.indexOf(this.pauseMenuBg), 1);
        UILayer.splice(UILayer.indexOf(this.titleScreenBtn), 1);
        this.titleScreenBtn.removeText();

        const volumeSlider = document.getElementById('volume-slider');
        volumeSlider.style.display = "none";
        this.visible = false;
        Camera.ui.updatePerspective();
    },

    setVolumeCssSettingsForPauseMenu: function() {
        const volumeSlider = document.getElementById('volume-slider');
        volumeSlider.style.display = "flex";
        volumeSlider.style.top = "37.5%";
        volumeSlider.style.bottom = "auto";
        volumeSlider.style.left = "50%";
        volumeSlider.style.transform = "translate(-50%, -50%)";
    }
}
