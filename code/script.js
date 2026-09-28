/* =========================================================
   LANDING PAGE CONTROL
========================================================= */

const landingPage = document.getElementById("landingPage");
const appPage = document.getElementById("appPage");


function enterCyberGuard() {

    landingPage.style.display = "none";

    appPage.classList.remove("hidden-app");

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });

}


function exitCyberGuard() {

    appPage.classList.add("hidden-app");

    landingPage.style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });

}


function scrollToSection(id) {

    const section = document.getElementById(id);

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth"
    });

}
