import { handleGoogleSign } from "../firebase.js";

const loginByGoogleBtn = document.querySelector("#login-btn");
loginByGoogleBtn.addEventListener("click", () => handleGoogleSign());
