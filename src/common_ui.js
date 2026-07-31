/* Contains tools for quickly constructing common UI components */

const gameUI = {
    createButton: function(x, y, text) {
        const button = new UIPanel(x, y, 8, 2, ["./textures/menu/begin_button_bg_0.png", "./textures/menu/begin_button_bg_1.png"]);
        button.addText(text);
        button.update = () => {
            if(button.mouseHovering) {
                button.textureIndex = 1;
            } else {
                button.textureIndex = 0;
            }
        }
        return button;
    }, 
    createHeader: function(x, y, text) {
        const header = new UIPanel(x, y, 1, 3);
        header.addText(text);
        header.fitToText();
        return header;
    }
}