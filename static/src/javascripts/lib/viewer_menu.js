function toggleViewerMenu(e) {
    e.stopPropagation();
    const menuContent = document.getElementById("ham_menu_content");
    if (menuContent) {
        menuContent.classList.toggle("hidden");
    }
}

function clickElseWhere() {
    const menuContent = document.getElementById("ham_menu_content");
    if (menuContent && !menuContent.classList.contains("hidden")) {
        menuContent.classList.toggle("hidden");
    }
}

function initViewerMenuButton() {
    const menuButton = document.getElementById("ham_btn");
    menuButton.addEventListener("click", toggleViewerMenu);
    const grid = document.getElementsByClassName("page-grid");
    if (grid.length == 1) {
        grid[0].addEventListener("click", clickElseWhere);
    }
}

export {
    initViewerMenuButton,
};